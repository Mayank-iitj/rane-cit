# Investor One-Page Summary: Low-Cost CNC Loading/Unloading Automation

## Opportunity
Small and medium manufacturing units (SMEs) running CNC machines lose 15-30% shift time due to manual loading/unloading, causing lower throughput, higher fatigue risk, inconsistent quality, and avoidable safety exposure.

Industrial robotic cells typically cost Rs6-20 lakh and are often not feasible for SME budgets.

## Solution
A production-ready, low-cost CNC automation cell built from proven off-the-shelf components:
- 2-axis/3-axis pick-and-place loader (gantry-first design)
- ESP32/Arduino control + Raspberry Pi compute
- CNC integration via digital I/O and/or Modbus RTU
- Vision-assisted verification (OpenCV, optional YOLO)
- Safety-first control with E-stop, interlocks, retry logic, manual override

## Why This Wins
- Targets the same workflow as expensive robotic cells at 10-30% of cost
- Built on currently available hardware/software (no speculative tech)
- Modular deployment path from low-cost pilot to multi-machine scale
- Open-source software stack reduces licensing burden

## Economics
| Build Tier | Estimated Cost |
|-----------|----------------|
| Low-cost pilot | ~Rs30,000 |
| Mid-range production | ~Rs60,000 |
| Higher-end SME deployment | ~Rs1,04,000 |

Typical first deployment including contingency and fabrication can land in the Rs75,000-Rs90,000 band for robust mid-range builds.

## Expected Impact (Conservative)
- Idle time reduction: 15-25%
- Throughput improvement: 10-20%
- Better repeatability: fewer misloads/scrap events
- Safety improvement: fewer manual entries into machining zone
- ROI window: 12-24 months (machine utilization and labor-dependent)

## Technical Readiness
- Control architecture: deterministic state machine with fail-safe states
- Integration modes: digital I/O, M-code hooks, Modbus RTU, optional Ethernet/OPC-UA
- Data stack: local logging (SQLite) with optional cloud/central monitoring
- Scale path: one edge node per machine with MQTT aggregation

## Deployment Timeline
- Site survey to production trial: ~8-12 working days for first machine
- Repeat deployments are faster via reused mechanical/electrical templates

## Business Model Options
- Capex sale (one-time hardware + commissioning)
- Automation-as-a-service (monthly support + uptime SLA)
- Multi-machine rollout package with centralized monitoring add-on

## Key Risks and Mitigations
| Risk | Mitigation |
|------|------------|
| Machine integration variability | Digital I/O fallback + modular protocol layer |
| Part geometry complexity | Start with fixed fixtures and simple parts; phase in vision |
| Operator acceptance | Manual override + training + staged deployment |
| Reliability in harsh shopfloor | Industrial enclosures, interlocks, preventive maintenance |

## Ask / Next Step
Run a paid pilot on 1 CNC machine with measurable KPIs:
- baseline vs automated cycle time
- unattended runtime gain
- scrap/rework delta
- operator intervention count

A successful pilot de-risks full-cell rollout and unlocks multi-machine scaling.