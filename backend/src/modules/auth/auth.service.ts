import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import {
  AuthResponseDto,
  GoogleVerifyTokenDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from '../../dtos';
import { Organization, User } from '../../entities';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  org_id: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client();
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const org = await this.getOrCreateOrganization(dto.organization_name);

    const existing = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase(), organization_id: org.id },
    });

    if (existing) {
      throw new ConflictException('User already exists for this organization');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      email: dto.email.toLowerCase(),
      password_hash: passwordHash,
      first_name: dto.first_name,
      last_name: dto.last_name,
      role: 'OWNER',
      status: 'ACTIVE',
      email_verified: false,
      organization_id: org.id,
    });

    const saved = await this.usersRepository.save(user);
    await this.ensureOwnerIsSet(org.id, saved.id);

    return this.buildAuthResponse(saved);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
      order: { created_at: 'ASC' },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    user.last_login_at = new Date();
    await this.usersRepository.save(user);

    return this.buildAuthResponse(user);
  }

  async verifyGoogleToken(dto: GoogleVerifyTokenDto): Promise<AuthResponseDto> {
    if (!dto.id_token) {
      throw new BadRequestException('Missing Google ID token');
    }

    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new BadRequestException('GOOGLE_CLIENT_ID is not configured');
    }

    let tokenEmail = '';
    let tokenGivenName = '';
    let tokenFamilyName = '';
    let tokenGoogleId = '';

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.id_token,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload?.email || !payload?.sub) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      tokenEmail = payload.email.toLowerCase();
      tokenGivenName = payload.given_name || dto.first_name;
      tokenFamilyName = payload.family_name || dto.last_name;
      tokenGoogleId = payload.sub;
    } catch {
      throw new UnauthorizedException('Failed to verify Google ID token');
    }

    const org = await this.getOrCreateOrganization(dto.organization_name);

    let user = await this.usersRepository.findOne({
      where: [
        { email: tokenEmail, organization_id: org.id },
        { google_id: tokenGoogleId, organization_id: org.id },
      ],
    });

    if (!user) {
      user = this.usersRepository.create({
        email: tokenEmail,
        first_name: tokenGivenName,
        last_name: tokenFamilyName,
        role: 'USER',
        status: 'ACTIVE',
        organization_id: org.id,
        google_id: tokenGoogleId,
        password_hash: 'google_oauth_no_password',
        email_verified: true,
        last_login_at: new Date(),
      });
    } else {
      user.first_name = tokenGivenName;
      user.last_name = tokenFamilyName;
      user.google_id = tokenGoogleId || user.google_id;
      user.last_login_at = new Date();
      user.email_verified = true;
    }

    const saved = await this.usersRepository.save(user);
    return this.buildAuthResponse(saved);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refresh_token);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }

      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.buildAuthResponse(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid access token type');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private async getOrCreateOrganization(name?: string): Promise<Organization> {
    const resolvedName = (name || 'Public Organization').trim();
    const slug = resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'public-organization';

    const existing = await this.organizationsRepository.findOne({ where: { slug } });
    if (existing) {
      return existing;
    }

    const organization = this.organizationsRepository.create({
      name: resolvedName,
      slug,
      tier: 'TRIAL',
      is_active: true,
      owner_id: '',
      settings: {},
      machine_limit: 50,
      user_limit: 25,
    });

    return this.organizationsRepository.save(organization);
  }

  private async ensureOwnerIsSet(organizationId: string, userId: string): Promise<void> {
    const organization = await this.organizationsRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
      return;
    }

    if (!organization.owner_id) {
      organization.owner_id = userId;
      await this.organizationsRepository.save(organization);
    }
  }

  private async buildAuthResponse(user: User): Promise<AuthResponseDto> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      org_id: user.organization_id,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      ...accessPayload,
      type: 'refresh',
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: '30m',
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: '7d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id,
      },
    };
  }
}
