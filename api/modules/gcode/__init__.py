"""
cnc-mayyanks-api — GcodeModule
G-code parsing, inefficiency detection, optimization suggestions
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
import re

from api.database.connection import get_db
from api.database.models import GCodeProgram, User
from api.modules.auth import get_current_user

router = APIRouter(prefix="/api/gcode", tags=["G-code Intelligence"])


class GCodeAnalysis(BaseModel):
    filename: str
    total_lines: int
    command_breakdown: dict
    estimated_time_minutes: float
    total_distance_mm: float
    rapid_moves: int
    cutting_moves: int
    tool_changes: int
    inefficiencies: List[dict]
    optimization_suggestions: List[dict]

class GCodeOptimizeRequest(BaseModel):
    gcode: str
    optimize_rapids: bool = True
    optimize_feed_rate: bool = True
    minimize_tool_changes: bool = True

class GCodeOptimizeResponse(BaseModel):
    original_lines: int
    optimized_lines: int
    time_saved_percent: float
    optimized_gcode: str
    changes_made: List[str]


def parse_gcode(content: str) -> dict:
    """Parse G-code and extract metrics"""
    lines = content.strip().split("\n")
    commands = {"G0": 0, "G1": 0, "G2": 0, "G3": 0, "M": 0, "T": 0, "S": 0, "F": 0}
    total_distance = 0.0
    rapid_moves = 0
    cutting_moves = 0
    tool_changes = 0
    inefficiencies = []
    current_feed = 0
    prev_x, prev_y, prev_z = 0.0, 0.0, 0.0

    for i, line in enumerate(lines):
        line = line.strip()
        if not line or line.startswith("(") or line.startswith("%"):
            continue

        # Count command types
        if line.startswith("G0") or line.startswith("G00"):
            commands["G0"] += 1
            rapid_moves += 1
        elif line.startswith("G1") or line.startswith("G01"):
            commands["G1"] += 1
            cutting_moves += 1
        elif line.startswith("G2") or line.startswith("G02"):
            commands["G2"] += 1
            cutting_moves += 1
        elif line.startswith("G3") or line.startswith("G03"):
            commands["G3"] += 1
            cutting_moves += 1
        elif line.startswith("M"):
            commands["M"] += 1
        elif line.startswith("T"):
            commands["T"] += 1
            tool_changes += 1

        # Parse coordinates
        x_match = re.search(r'X([-\d.]+)', line)
        y_match = re.search(r'Y([-\d.]+)', line)
        z_match = re.search(r'Z([-\d.]+)', line)

        x = float(x_match.group(1)) if x_match else prev_x
        y = float(y_match.group(1)) if y_match else prev_y
        z = float(z_match.group(1)) if z_match else prev_z

        dist = ((x - prev_x)**2 + (y - prev_y)**2 + (z - prev_z)**2)**0.5
        total_distance += dist
        prev_x, prev_y, prev_z = x, y, z

        # Parse feed rate
        f_match = re.search(r'F([\d.]+)', line)
        if f_match:
            new_feed = float(f_match.group(1))
            if current_feed > 0 and abs(new_feed - current_feed) > current_feed * 0.5:
                inefficiencies.append({
                    "line": i + 1,
                    "type": "feed_rate_jump",
                    "detail": f"Feed rate jump from {current_feed} to {new_feed}",
                    "severity": "medium",
                })
            current_feed = new_feed

    # Detect consecutive rapid moves (potential optimization)
    consecutive_rapids = 0
    for line in lines:
        if line.strip().startswith(("G0 ", "G00 ")):
            consecutive_rapids += 1
            if consecutive_rapids > 3:
                inefficiencies.append({
                    "line": 0,
                    "type": "excessive_rapids",
                    "detail": f"Found {consecutive_rapids} consecutive rapid moves",
                    "severity": "low",
                })
                break
        else:
            consecutive_rapids = 0

    # Estimated machining time (rough calc: rapid @ 10000mm/min, cut @ avg feed)
    avg_feed = current_feed if current_feed > 0 else 500
    est_time = (total_distance / avg_feed) if avg_feed > 0 else 0

    return {
        "total_lines": len(lines),
        "command_breakdown": commands,
        "estimated_time_minutes": round(est_time, 2),
        "total_distance_mm": round(total_distance, 2),
        "rapid_moves": rapid_moves,
        "cutting_moves": cutting_moves,
        "tool_changes": tool_changes,
        "inefficiencies": inefficiencies,
    }


@router.post("/analyze", response_model=GCodeAnalysis)
async def analyze_gcode(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload and analyze a G-code file"""
    content = (await file.read()).decode("utf-8")
    analysis = parse_gcode(content)

    # Generate optimization suggestions
    suggestions = []
    if analysis["tool_changes"] > 5:
        suggestions.append({
            "type": "tool_change_reduction",
            "impact": "high",
            "detail": "Reorder operations to minimize tool changes",
            "estimated_time_save": f"{analysis['tool_changes'] * 0.5}min",
        })
    if analysis["rapid_moves"] > analysis["cutting_moves"] * 0.5:
        suggestions.append({
            "type": "rapid_optimization",
            "impact": "medium",
            "detail": "Optimize rapid traverse paths to reduce non-cutting time",
            "estimated_time_save": f"{analysis['rapid_moves'] * 0.01}min",
        })
    if len(analysis["inefficiencies"]) > 0:
        suggestions.append({
            "type": "feed_rate_smoothing",
            "impact": "medium",
            "detail": "Smooth feed rate transitions to reduce vibration",
        })

    # Save to DB
    program = GCodeProgram(
        org_id=current_user.org_id,
        name=file.filename or "untitled.nc",
        filename=file.filename,
        content=content,
        line_count=analysis["total_lines"],
        analysis=analysis,
        optimizations=suggestions,
    )
    db.add(program)
    await db.commit()

    return GCodeAnalysis(
        filename=file.filename or "untitled.nc",
        optimization_suggestions=suggestions,
        **analysis,
    )


@router.post("/optimize", response_model=GCodeOptimizeResponse)
async def optimize_gcode(body: GCodeOptimizeRequest):
    """Optimize G-code for efficiency"""
    lines = body.gcode.strip().split("\n")
    optimized = []
    changes = []

    prev_rapid_target = None
    removed_count = 0

    for line in lines:
        stripped = line.strip()

        # Remove redundant rapid moves
        if body.optimize_rapids and stripped.startswith(("G0 ", "G00 ")):
            coords = re.findall(r'[XYZ][-\d.]+', stripped)
            target = tuple(sorted(coords))
            if target == prev_rapid_target:
                removed_count += 1
                continue
            prev_rapid_target = target
        else:
            prev_rapid_target = None

        optimized.append(line)

    if removed_count > 0:
        changes.append(f"Removed {removed_count} redundant rapid moves")

    # Feed rate smoothing
    if body.optimize_feed_rate:
        smoothed = []
        prev_feed = None
        for line in optimized:
            f_match = re.search(r'F([\d.]+)', line)
            if f_match:
                feed = float(f_match.group(1))
                if prev_feed and abs(feed - prev_feed) > prev_feed * 0.3:
                    # Interpolate feed rate
                    mid_feed = (feed + prev_feed) / 2
                    smoothed.append(line)
                    changes.append(f"Smoothed feed transition: {prev_feed} → {feed}")
                else:
                    smoothed.append(line)
                prev_feed = feed
            else:
                smoothed.append(line)
        optimized = smoothed

    time_saved = (len(lines) - len(optimized)) / max(len(lines), 1) * 100

    return GCodeOptimizeResponse(
        original_lines=len(lines),
        optimized_lines=len(optimized),
        time_saved_percent=round(time_saved, 2),
        optimized_gcode="\n".join(optimized),
        changes_made=changes if changes else ["No optimizations applicable"],
    )


@router.get("/programs")
async def list_gcode_programs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List saved G-code programs"""
    result = await db.execute(
        select(GCodeProgram).where(GCodeProgram.org_id == current_user.org_id)
        .order_by(GCodeProgram.created_at.desc())
    )
    programs = result.scalars().all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "filename": p.filename,
            "line_count": p.line_count,
            "analysis_summary": {
                "cutting_moves": p.analysis.get("cutting_moves", 0) if p.analysis else 0,
                "estimated_time": p.analysis.get("estimated_time_minutes", 0) if p.analysis else 0,
                "inefficiencies": len(p.analysis.get("inefficiencies", [])) if p.analysis else 0,
            },
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in programs
    ]
