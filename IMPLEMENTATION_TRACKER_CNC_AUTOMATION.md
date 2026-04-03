# CNC Loader Automation Implementation Tracker

Status key: [ ] Not started | [~] In progress | [x] Complete | [!] Blocked

## Program Overview
- Target segment: SME CNC cells
- Cost target: Rs30,000 to Rs1,50,000
- Primary reference design: 2-axis/3-axis loader with CNC I/O handshake

## Phase 1: Site and Requirement Baseline (Day 1)
- [ ] Confirm CNC model, controller type, available digital I/O and protocol support
- [ ] Capture current cycle time breakdown (cut, load, unload, idle)
- [ ] Measure workspace envelope and safe robot travel zone
- [ ] Identify part family for pilot and tolerance-critical surfaces
- [ ] Record door behavior: manual, semi-auto, or auto
- [ ] Define pilot KPI baseline

## Phase 2: Mechanical Build and Fixtures (Days 2-4)
- [ ] Install gantry/arm frame and vibration-safe mounts
- [ ] Install input tray/magazine and output tray with soft landing
- [ ] Define chuck approach/retract waypoints and clearance margins
- [ ] Add hard stops and cable chain routing
- [ ] Validate repeatability at pick/place points

## Phase 3: Electrical and Safety (Days 4-6)
- [ ] Wire E-stop NC loop in series with motion enable
- [ ] Integrate door sensor and interlock behavior
- [ ] Wire limit switches for all active axes and homing
- [ ] Integrate CNC cycle-complete input via optocoupler isolation
- [ ] Integrate CNC cycle-start output relay from automation panel
- [ ] Add protective enclosure, terminal labeling, and fuse map
- [ ] Run point-to-point continuity and insulation checks

## Phase 4: Control Software Bring-Up (Day 6)
- [ ] Flash MCU firmware (I/O map, heartbeat, driver enable logic)
- [ ] Configure edge computer image and static network settings
- [ ] Deploy control stack modules: FSM, hardware abstraction, logging
- [ ] Configure machine profile (ID, coordinate limits, protocol mode)
- [ ] Validate watchdog and heartbeat timeout behavior

## Phase 5: CNC Handshake Integration (Day 7)
- [ ] Verify cycle-complete trigger from CNC end-of-program
- [ ] Verify cycle-start trigger acceptance on CNC input
- [ ] Add spindle-stopped gate prior to chuck approach
- [ ] Verify no-motion interlock when unsafe states are active
- [ ] Test timeout behavior when CNC does not respond

## Phase 6: Vision and Sensor Calibration (Day 8)
- [ ] Capture reference images at production lighting levels
- [ ] Set ROI and thresholds for chuck-empty/part-present checks
- [ ] Calibrate orientation estimate and pixel-to-mm transform
- [ ] Tune grip confirmation thresholds (pressure/load)
- [ ] Validate sensor plausibility checks and fallback conditions

## Phase 7: Motion Tuning and State Machine Validation (Day 9)
- [ ] Set acceleration/deceleration and safe feed limits
- [ ] Validate full state sequence without parts (dry run)
- [ ] Validate with parts and induced faults (pickup fail, misalignment)
- [ ] Confirm retry limits and safe return behavior
- [ ] Verify manual override mode and controlled recovery

## Phase 8: Production Trial and Handover (Days 10-12)
- [ ] Run pilot shift with production parts
- [ ] Compare baseline KPI vs pilot KPI
- [ ] Train operators and maintenance staff
- [ ] Handover SOP, maintenance checklist, and escalation matrix
- [ ] Sign-off with go/no-go criteria for multi-machine rollout

## KPI Scoreboard (Pilot Acceptance)
| KPI | Baseline | Target | Actual | Status |
|-----|----------|--------|--------|--------|
| Load/unload time per cycle | ___ s | <= 60 s | ___ s | [ ] |
| CNC idle ratio | ___ % | -15% to -25% | ___ % | [ ] |
| Throughput per shift | ___ parts | +10% to +20% | ___ parts | [ ] |
| Misload/scrap events | ___ /shift | Downward trend | ___ /shift | [ ] |
| Safety interventions | ___ /shift | Reduced | ___ /shift | [ ] |

## Risk Register
| ID | Risk | Trigger | Mitigation | Owner | Status |
|----|------|---------|------------|-------|--------|
| R1 | CNC I/O incompatibility | No reliable handshake | Use relay/optocoupler fallback and M-code mapping | Controls | [ ] |
| R2 | Grip instability | Failed pickup retries > 3 | Jaw redesign + pressure tuning + approach offsets | Mechanical | [ ] |
| R3 | Vision drift | False negatives under lighting changes | Add fixed lighting and scheduled recalibration | Software | [ ] |
| R4 | Operator resistance | Manual bypass overused | Training + SOP + dashboard transparency | Operations | [ ] |

## Alignment with Existing Repository Documents
- Program status context: [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)
- Architecture and capabilities: [README.md](README.md)
- File/module map: [PROJECT_INDEX.md](PROJECT_INDEX.md)
- Deployment process references: [DEPLOYMENT.md](DEPLOYMENT.md) and [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md)

## Weekly Review Cadence
- [ ] Monday: risk review and parts availability
- [ ] Wednesday: KPI delta review and tuning actions
- [ ] Friday: safety checks and readiness gate for next week