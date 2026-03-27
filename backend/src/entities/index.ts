import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Machine } from './machine.entity';
import { Telemetry } from './telemetry.entity';
import { Alert } from './alert.entity';
import { GcodeProgram } from './gcode-program.entity';
import { ApiKey } from './api-key.entity';
import { AuditLog } from './audit-log.entity';

export { Organization } from './organization.entity';
export { User } from './user.entity';
export { Machine } from './machine.entity';
export { Telemetry } from './telemetry.entity';
export { Alert } from './alert.entity';
export { GcodeProgram } from './gcode-program.entity';
export { ApiKey } from './api-key.entity';
export { AuditLog } from './audit-log.entity';

// All entities array for TypeORM configuration
export const entities = [
  Organization,
  User,
  Machine,
  Telemetry,
  Alert,
  GcodeProgram,
  ApiKey,
  AuditLog,
];
