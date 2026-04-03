# Production-Ready Low-Cost CNC Machine Loading/Unloading Automation System

**Target:** Small and Medium Manufacturing Units (SMEs)  
**Target Prototype Cost:** Rs30,000 - Rs1,50,000  
**Status:** Industrially Viable, Implementable with Current Technology

---

## 1. Problem Context

CNC machines in small workshops face recurring operational challenges:

| Issue | Impact |
|-------|--------|
| Manual loading/unloading | Machine idle time 15-30% of shift |
| Operator fatigue | Repetitive strain injuries, reduced consistency |
| Inconsistent part placement | Scrap, rework, tool wear |
| Lower throughput | Limited unattended production |
| Safety risks | Exposure to rotating spindles, moving parts |

Industrial robotic cells (Rs6-20 lakh) are typically unaffordable for SMEs. This design addresses the same workflow at a fraction of the cost using proven, off-the-shelf components and standard industrial protocols.

---

## 2. Functional Requirements

### Primary Operations (Sequential)

| # | Operation | Requirement |
|---|-----------|-------------|
| 1 | Cycle completion detection | Sense M-code, relay, or timer-based signal |
| 2 | Door handling | Open door (if automated) or wait for manual open |
| 3 | Unload finished part | Remove from chuck/fixture without damage |
| 4 | Place finished part | Deposit in output tray/conveyor |
| 5 | Pick raw part | From feed tray/magazine |
| 6 | Load new part | Correct position and orientation |
| 7 | Trigger next cycle | Send start signal to CNC |
| 8 | Monitor and alert | Log state, errors, production counts |

### Secondary Requirements

- **Fail-safe mechanisms:** Safe shutdown on fault
- **Manual override:** Operator can disable automation and run manually
- **Operator safety detection:** Simple presence detection (IR/ultrasonic)
- **Logging:** Cycle count, timestamps, errors to local DB and optional cloud

---

## 3. Hardware Architecture

### 3.1 Hardware Block Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LOW-COST CNC LOADER AUTOMATION SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────────┐   │
│  │   SENSORS    │    │   ACTUATORS  │    │         COMPUTATION               │   │
│  │              │    │              │    │                                  │   │
│  │ • Proximity  │    │ • Stepper/   │    │  Raspberry Pi 4/5                 │   │
│  │ • Limit SW   │    │   Servo      │    │  • Motion control                 │   │
│  │ • IR beam    │    │ • Gripper    │    │  • Vision (OpenCV/YOLO)           │   │
│  │ • Door SW    │    │ • Door act.  │    │  • State machine                  │   │
│  │ • Load cell  │    │              │    │  • Web dashboard                  │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┬───────────────────┘   │
│         │                   │                           │                       │
│         │    ┌──────────────┴──────────────┐            │                       │
│         └───►│   CONTROL LAYER             │◄───────────┘                       │
│              │   ESP32 / Arduino Mega      │                                    │
│              │   • GPIO I/O expansion      │      ┌─────────────────┐           │
│              │   • Modbus RTU (RS485)      │◄────►│     CNC         │           │
│              │   • E-stop handling         │      │   (Fanuc/Siemens │           │
│              │   • Motor drivers (TB6600)  │      │   Haas/etc.)     │           │
│              └────────────────────────────┘      └─────────────────┘           │
│                                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────────┐   │
│  │   POWER      │    │   SAFETY     │    │   VISION                         │   │
│  │ 24V 5A PSU   │    │ E-stop,      │    │ USB Camera / Pi Camera v2        │   │
│  │ 12V 2A       │    │ Interlocks   │    │ LED ring light                    │   │
│  └──────────────┘    └──────────────┘    └──────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Selection and Justification

#### Industrial Control Layer

| Component | Recommendation | Justification | Cost (Rs) |
|-----------|----------------|---------------|----------|
| Microcontroller | ESP32 or Arduino Mega 2560 | ESP32: WiFi/BT, dual-core, low cost. Arduino: wide ecosystem, industrial shields. Both support Modbus RTU via libraries. | 500-1,200 |
| Alternative PLC | Siemens LOGO! 8 (optional upgrade) | True industrial PLC, Modbus, ladder logic; higher cost but better for harsh environments. | 8,000-12,000 |
| Communication | RS485 + Modbus RTU, Ethernet (optional) | Industry standard; supported by most CNCs, PLCs, and HMIs. | 300-600 |

#### Computation Layer

| Component | Recommendation | Justification | Cost (Rs) |
|-----------|----------------|---------------|----------|
| Edge computer | Raspberry Pi 4 (4GB) or Pi 5 | Runs Python (OpenCV, Flask/FastAPI), real-time control possible with proper design. Pi 5 offers better performance for YOLO. | 4,500-7,500 |
| Alternative | NVIDIA Jetson Nano (2GB) | Better for YOLO inference; higher cost. Use if heavy object detection required. | 8,000-12,000 |

#### Motion System Options

| Option | Components | Best For | Cost (Rs) |
|--------|------------|----------|----------|
| **A: Cartesian Gantry** | 3x NEMA17 steppers, linear rails, lead screws, TB6600 drivers | Rectangular work envelope, predictable paths | 8,000-15,000 |
| **B: 4-5 DOF Arm** | DIY/educational arm (e.g., Elephant Robotics myCobot 320) or similar | Flexible reach, smaller footprint | 15,000-40,000 |
| **C: Hybrid Pick and Place** | 2-axis gantry (X-Z) + rotary table for orientation | High repeatability, simpler kinematics | 6,000-12,000 |

**Recommendation for SME budget:** Option C (2-axis gantry) or a simple 3-axis Cartesian system for first deployment. Easier to commission and maintain.

#### End Effector

| Type | Use Case | Cost (Rs) |
|------|----------|----------|
| Pneumatic gripper (SMC, Festo clone) | General-purpose, reliable | 2,000-5,000 |
| Servo gripper (small parallel jaw) | Programmable force, feedback | 3,000-8,000 |
| Magnetic pickup | Ferrous parts only, simple | 500-1,500 |
| Mechanical 2-finger (servo) | Non-magnetic, adjustable | 1,500-4,000 |

**Recommendation:** Pneumatic gripper with pressure sensor for grip confirmation; solenoid valve controlled by microcontroller.

#### Sensors

| Sensor | Purpose | Cost (Rs) |
|--------|---------|----------|
| Inductive proximity (12-24 mm) | Metal part presence in chuck | 200-400 |
| IR break-beam | Part in/out of pick position | 150-300 |
| Limit switches (mechanical) | Axis limits, homing | 50-100 each |
| Reed/magnetic door sensor | Door open/closed | 100-200 |
| Load cell / strain gauge (optional) | Grip force verification | 500-2,000 |
| Ultrasonic distance (optional) | Operator presence near machine | 200-400 |

#### Vision System

| Component | Recommendation | Cost (Rs) |
|-----------|----------------|----------|
| Camera | Logitech C920 / Pi Camera v2 / Arducam 8MP | 1,500-3,500 |
| Lighting | Adjustable LED ring or bar (12V) | 500-1,500 |

#### Safety

| Component | Cost (Rs) |
|-----------|----------|
| E-stop (red mushroom, NC contacts) | 300-800 |
| Safety interlock relay (optional) | 1,500-3,000 |
| Light curtain (optional, for larger cells) | 5,000-15,000 |

#### Power

| Component | Cost (Rs) |
|-----------|----------|
| 24V 5A switched PSU (industrial) | 800-1,500 |
| 12V 2A for logic/camera | 300-500 |

### 3.3 Wiring Architecture (Simplified)

```text
                    ESP32 / Arduino Mega
                    ┌─────────────────────┐
                    │                     │
  E-stop ──────────►│ Digital IN (NC)     │
  Door sensor ─────►│ Digital IN          │
  Limit X,Y,Z ─────►│ Digital IN          │
  Proximity chuck ─►│ Digital IN          │
  IR beam ─────────►│ Digital IN          │
                    │                     │
                    │ Digital OUT ────────┼──► Gripper solenoid
                    │ Digital OUT ────────┼──► Door actuator
                    │ PWM ────────────────┼──► (if servo gripper)
                    │                     │
                    │ UART/RS485 ─────────┼──► CNC (if Modbus)
                    │ I2C ────────────────┼──► Load sensor (optional)
                    │ SPI ────────────────┼──► (reserved)
                    │                     │
                    │ USB/UART ───────────┼──► Raspberry Pi (serial/JSON)
                    └─────────────────────┘

  Stepper Drivers (TB6600) ←── Step/Dir from ESP32 or dedicated CNC shield
```

### 3.4 Cost Breakdown (Target: Rs30,000 - Rs1,50,000)

| Category | Low-Cost Build (Rs) | Mid-Range Build (Rs) | Higher-End Build (Rs) |
|----------|--------------------|---------------------|----------------------|
| Computation (Pi 4/5) | 5,000 | 7,000 | 12,000 |
| Control (ESP32/Arduino) | 800 | 1,500 | 3,000 |
| Motion (gantry/actuators) | 10,000 | 20,000 | 35,000 |
| End effector | 2,500 | 5,000 | 8,000 |
| Sensors | 2,000 | 4,000 | 6,000 |
| Vision (camera + light) | 2,500 | 4,000 | 5,000 |
| Safety (E-stop, interlocks) | 1,000 | 2,500 | 5,000 |
| Power, enclosures, cabling | 3,000 | 6,000 | 10,000 |
| Mechanical frame/fabrication | 3,200 | 10,000 | 20,000 |
| **Total** | **~Rs30,000** | **~Rs60,000** | **~Rs1,04,000** |

*Contingency (15-20%) and assembly labor can push mid-range to ~Rs75,000-90,000.*

---

## 4. Software Architecture

### 4.1 Modular Structure

```text
┌─────────────────────────────────────────────────────────────────┐
│                     SOFTWARE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Web       │  │   State     │  │   Motion Control        │  │
│  │   Dashboard │  │   Machine   │  │   (IK, trajectory)      │  │
│  │   (Flask/   │  │   (FSM)     │  │   • G-code interpreter  │  │
│  │   FastAPI)  │  │             │  │   • Stepper control     │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          │                                      │
│  ┌───────────────────────┼───────────────────────────────────┐  │
│  │              CORE CONTROL LAYER (Python)                   │  │
│  │  • Event bus / message queue                               │  │
│  │  • Hardware abstraction (sensors, actuators)               │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│  ┌───────────────────────┼───────────────────────────────────┐  │
│  │              HARDWARE INTERFACE LAYER                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │ Serial   │ │ GPIO     │ │ Modbus   │ │ MQTT/OPC-UA  │  │  │
│  │  │ (MCU)    │ │ (local)  │ │ (CNC)    │ │ (optional)   │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  VISION MODULE (OpenCV / YOLO)                            │  │
│  │  • Part presence in chuck                                 │  │
│  │  • Raw part orientation                                   │  │
│  │  • Chuck empty verification                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Control Software Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Python 3.10+ | Main control, vision, APIs |
| Real-time motion | `pycnc` / `python-urx` / custom stepper driver | Step generation, G-code-like moves |
| Vision | OpenCV 4.x, ultralytics (YOLO) | Detection, template matching |
| API | FastAPI | REST for dashboard, MQTT bridge |
| Communication | pymodbus, paho-mqtt | Modbus, MQTT |
| Database | SQLite (local) / PostgreSQL (optional) | Logs, cycle count, alerts |

### 4.3 Robot Control: Inverse Kinematics (Cartesian)

For a 3-axis Cartesian gantry, IK is trivial: position (x, y, z) maps directly to joint angles/positions.

**Pseudocode (Cartesian):**
```text
function move_to(x, y, z):
    steps_x = (x - current_x) / steps_per_mm_x
    steps_y = (y - current_y) / steps_per_mm_y
    steps_z = (z - current_z) / steps_per_mm_z
    run_trajectory_linear(steps_x, steps_y, steps_z, feed_rate)
```

For a 4-5 DOF arm, use established IK libraries (e.g., `ikpy`, `kdl`, or manufacturer SDK). **ikpy** is open-source and supports common arm geometries.

### 4.4 Motion Planning and Trajectory Smoothing

- **Trapezoidal velocity profile:** Industry standard for stepper/servo moves. Implement with `accel` and `decel` parameters.
- **Linear interpolation:** For point-to-point moves, use linear segments.
- **Avoid sharp corners:** Use blend radii or small circular arcs at corners to reduce jerk.

Libraries: `pyserial` for step commands to MCU, or use `GPIO` + bit-banging for simple setups. For production, consider `linuxcnc` or `grbl` on a dedicated controller.

### 4.5 Vision System (Real Algorithms)

| Task | Algorithm | Implementation |
|------|-----------|----------------|
| Part in chuck | Binary threshold + contour area | OpenCV `cv2.threshold`, `cv2.findContours` |
| Chuck empty | Same; area below threshold -> empty | Threshold on ROI |
| Raw part orientation | Template matching or Hough (for cylindrical) | `cv2.matchTemplate` or `cv2.HoughCircles` |
| Part recognition | YOLOv8-nano (ultralytics) | Pre-trained or fine-tuned on part images |

**Calibration:** Capture reference images with known part positions; store transform matrix for pixel-to-mm mapping.

### 4.6 Communication Layer

- **Modbus RTU (RS485):** Read/write CNC registers if supported (e.g., cycle complete flag, start signal).
- **Digital I/O:** Fallback: CNC provides 24V signal on cycle complete; automation reads via optocoupler.
- **MQTT:** Publish state, alerts; subscribe to commands (e.g., pause, resume). Broker: Mosquitto on Pi or cloud.
- **REST API:** Dashboard queries `/api/state`, `/api/cycles`, `/api/alerts`.

---

## 5. CNC Machine Integration

### 5.1 Integration Methods (In Order of Preference)

| Method | Complexity | Cost | Compatibility |
|--------|------------|------|---------------|
| Digital I/O (relay/optocoupler) | Low | Low | Most CNCs have free I/O |
| M-code custom | Low | None | Requires CNC parameter edit |
| Modbus RTU | Medium | Low | Modern CNCs (Fanuc, Siemens, Haas) |
| Ethernet (OPC-UA, FOCAS) | High | Medium | Higher-end CNCs |

### 5.2 Digital I/O Workflow (Most Common for SMEs)

```text
CNC Cycle Complete (M30/M02)
    -> CNC output relay closes (24V)
    -> Optocoupler isolates signal
    -> ESP32/Arduino reads HIGH
    -> State machine transitions to UnloadPart

After Load New Part:
    -> Automation closes relay (or drives output)
    -> CNC "Cycle Start" input receives 24V
    -> CNC starts next program
```

### 5.3 Example Wiring (Generic CNC)

- **CNC Output:** "Cycle Complete" or "Program End" -> Connect to automation input (via optocoupler).
- **Automation Output:** "Cycle Start" or "External Start" -> Connect to CNC input (relay output from automation).
- **Door:** If CNC has "Door Open" output, use for interlock. Automation only moves when door is open and safe.

### 5.4 Workflow Sequence

```text
1. CNC running -> Automation IDLE
2. CNC completes cycle -> Output signal ON
3. Automation: CycleCompleteDetected
4. Operator or automation opens door (if manual door: wait for door-open sensor)
5. Automation: DoorOpen -> UnloadPart
6. Unload finished part -> PlaceFinishedPart
7. PickNewPart from magazine
8. LoadNewPart into chuck, verify position
9. Automation: Verification OK
10. Automation: Output "Cycle Start" to CNC
11. Automation: Wait for door close (if applicable)
12. CNC starts next cycle
13. Automation: Idle (monitoring)
```

---

## 6. Control Logic (State Machine)

### 6.1 State Diagram

```text
                    ┌─────────────┐
                    │    IDLE     │◄──────────────────┐
                    └──────┬──────┘                   │
                           │ cycle_complete_signal    │
                           ▼                          │
                    ┌─────────────────────┐           │
                    │ CYCLE_COMPLETE_     │           │
                    │     DETECTED        │           │
                    └──────┬──────────────┘           │
                           │ door_open_sensor         │
                           ▼                          │
                    ┌─────────────┐                   │
                    │  DOOR_OPEN  │                   │
                    └──────┬──────┘                   │
                           │                          │
                           ▼                          │
                    ┌─────────────┐     fail          │
                    │ UNLOAD_PART │──────────────┐    │
                    └──────┬──────┘              │    │
                           │ success             │    │
                           ▼                     │    │
                    ┌─────────────────┐          │    │
                    │ PLACE_FINISHED_ │          │    │
                    │      PART       │          │    │
                    └──────┬──────────┘          │    │
                           │                     │    │
                           ▼                     │    │
                    ┌─────────────┐     fail     │    │
                    │ PICK_NEW_   │──────────────┼────┤
                    │    PART     │              │    │
                    └──────┬──────┘              │    │
                           │ success             │    │
                           ▼                     │    │
                    ┌─────────────┐     fail     │    │
                    │ LOAD_NEW_   │──────────────┼────┤
                    │    PART     │              │    │
                    └──────┬──────┘              │    │
                           │ success             │    │
                           ▼                     │    │
                    ┌─────────────┐     fail     │    │
                    │ VERIFICATION│──────────────┼────┤
                    └──────┬──────┘              │    │
                           │ pass                │    │
                           ▼                     │    │
                    ┌─────────────┐              │    │
                    │ CYCLE_      │              │    │
                    │ RESTART     │──────────────┘    │
                    └─────────────┘   (return IDLE)   │
                                                      │
                    On any ERROR -> ERROR_STATE ────────┘
                    Manual override -> MANUAL_MODE
```

### 6.2 Pseudocode for Control Logic

```python
class LoaderState(Enum):
    IDLE = 0
    CYCLE_COMPLETE_DETECTED = 1
    DOOR_OPEN = 2
    UNLOAD_PART = 3
    PLACE_FINISHED_PART = 4
    PICK_NEW_PART = 5
    LOAD_NEW_PART = 6
    VERIFICATION = 7
    CYCLE_RESTART = 8
    ERROR = 9
    MANUAL_MODE = 10

def state_machine_loop():
    state = LoaderState.IDLE
    retry_count = 0
    MAX_RETRIES = 3

    while True:
        if e_stop_pressed():
            safe_stop_all()
            state = LoaderState.ERROR
            await human_intervention()
            continue

        if manual_override_active():
            state = LoaderState.MANUAL_MODE
            disable_automation_outputs()
            continue

        if state == LoaderState.IDLE:
            if cycle_complete_signal():
                state = LoaderState.CYCLE_COMPLETE_DETECTED
                log_event("cycle_complete")

        elif state == LoaderState.CYCLE_COMPLETE_DETECTED:
            if door_open_sensor():
                state = LoaderState.DOOR_OPEN
            elif timeout(30):  # sec
                alert("Door not open after cycle complete")
                state = LoaderState.ERROR

        elif state == LoaderState.DOOR_OPEN:
            state = LoaderState.UNLOAD_PART
            retry_count = 0

        elif state == LoaderState.UNLOAD_PART:
            move_to_chuck()
            open_gripper()
            close_gripper()
            if not grip_confirmed():
                retry_count += 1
                if retry_count >= MAX_RETRIES:
                    state = LoaderState.ERROR
                    alert("Unload failed: no grip")
                continue
            retract_from_chuck()
            state = LoaderState.PLACE_FINISHED_PART

        elif state == LoaderState.PLACE_FINISHED_PART:
            move_to_output_tray()
            open_gripper()
            if not part_dropped_sensor():
                retry_count += 1
                if retry_count >= MAX_RETRIES:
                    state = LoaderState.ERROR
                continue
            state = LoaderState.PICK_NEW_PART
            retry_count = 0

        elif state == LoaderState.PICK_NEW_PART:
            if not raw_part_available():
                alert("No raw parts in magazine")
                state = LoaderState.ERROR
                continue
            move_to_magazine()
            orient_gripper(vision_get_part_angle())
            close_gripper()
            if not grip_confirmed():
                retry_count += 1
                if retry_count >= MAX_RETRIES:
                    state = LoaderState.ERROR
                continue
            state = LoaderState.LOAD_NEW_PART

        elif state == LoaderState.LOAD_NEW_PART:
            move_to_chuck()
            position_part_in_chuck()
            open_gripper()
            retract_from_chuck()
            state = LoaderState.VERIFICATION

        elif state == LoaderState.VERIFICATION:
            if vision_verify_part_loaded():
                state = LoaderState.CYCLE_RESTART
            else:
                retry_count += 1
                if retry_count >= MAX_RETRIES:
                    state = LoaderState.ERROR
                else:
                    state = LoaderState.UNLOAD_PART  # retry unload/load

        elif state == LoaderState.CYCLE_RESTART:
            trigger_cnc_cycle_start()
            wait_for_door_close()
            log_cycle_complete()
            state = LoaderState.IDLE

        elif state == LoaderState.ERROR:
            safe_stop_all()
            alert_and_log()
            await operator_acknowledge()
            state = LoaderState.IDLE

        sleep(0.02)  # 50 Hz loop
```

---

## 7. Safety Systems

### 7.1 Safety Hierarchy

| Level | Mechanism | Implementation |
|-------|-----------|----------------|
| 1 | E-stop | Hardware: NC contact in series with motor enable. Software: on E-stop, disable all motion. |
| 2 | Door interlock | No motion if door closed (when door must be open for load/unload). |
| 3 | Zone presence | Ultrasonic or IR: if operator in zone, reduce speed or pause. |
| 4 | Grip failure | If no force feedback when gripper should be closed -> stop, alert. |
| 5 | Overcurrent | Motor driver fault output -> disable axis. |
| 6 | Limit switches | Hard stop at travel limits; prevent overrun. |

### 7.2 Collision Avoidance with CNC Spindle

- **Never move into chuck zone while spindle is rotating.** Use CNC "Spindle Stop" or "Spindle At Speed" signal. Automation waits for spindle stopped (or M05) before approach.
- **Fixed approach/retract waypoints** defined in machine coordinates; never cross spindle center during load/unload.
- **Slow approach** (e.g., 10% feed) in last 20 mm before chuck.

### 7.3 Dropping Parts

- **Grip confirmation:** Pressure switch or load cell; reject cycle if grip not confirmed.
- **Retract path clear:** Verify no obstacle before retract.
- **Output tray:** Soft landing (rubber mat, spring-loaded tray) to avoid damage if drop occurs.

### 7.4 Safe Movement

- **Enable signal to drivers:** E-stop opens enable; all axes stop.
- **Deceleration on fault:** Software triggers decel ramp before disabling.
- **Limit switch reaction:** On trigger, immediately disable that axis (or all axes).

---

## 8. Reliability and Error Handling

| Failure Mode | Detection | Response |
|--------------|-----------|----------|
| Failed pickup | Grip sensor negative after close | Retry (max 3); then alert, move to safe position. |
| Dropped part | Load cell/beam broken during transport | Stop, alert; operator removes part; restart from UNLOAD or IDLE. |
| Part misalignment | Vision verification fails | Retry load; if still fail, alert, do not start cycle. |
| Communication loss (Pi-MCU) | Heartbeat timeout | MCU: disable motors, hold last state. Pi: alert, attempt reconnect. |
| Sensor malfunction | Limit switch stuck, beam always blocked | Use redundant check (e.g., vision); timeout-based override with caution. |
| CNC not responding | No cycle-complete within expected time | Timeout (e.g., 2x typical cycle); alert. |

### Retry Logic (Summary)

- **Pick/Place:** Up to 3 retries with small position offset.
- **Vision:** Up to 2 retries with re-light/re-capture.
- **Communication:** Exponential backoff reconnect; after 5 failures, require manual reset.

### Fallback Procedures

- **Automation fault:** Operator switches to manual; loads/unloads by hand; restarts CNC manually.
- **Vision down:** Option to run in "blind" mode with fixed positions (for known fixture geometry); higher risk, use only if calibrated.

---

## 9. Scalability

### 9.1 Multiple CNC Machines

- **Architecture:** One Pi per machine (or per 2 machines if load permits). Each Pi runs identical software; machine ID in config.
- **Central monitoring:** Each Pi publishes state via MQTT to a broker; central dashboard subscribes and displays all machines.
- **Cost scaling:** ~Rs50,000-80,000 per additional machine (reusing design, bulk components).

### 9.2 Centralized Monitoring

- **MQTT topics:** `factory/cnc1/state`, `factory/cnc1/cycles`, `factory/cnc1/alerts`.
- **Dashboard:** Grafana or custom web app; shows OEE, cycle count, downtime, alerts.
- **Database:** Central PostgreSQL or InfluxDB for historical data.

### 9.3 MES Integration

- **API:** REST endpoints for job start/end, part count, machine status.
- **Standards:** OPC-UA server on Pi (e.g., opcua-asyncio) for integration with MES/SCADA.
- **Barcode/QR:** Optional scanner for raw part lot; log to MES.

### 9.4 Predictive Maintenance

- **Log:** Motor current, cycle count, gripper cycles.
- **Indicators:** Rising current trend, increasing retry rate, gripper seal wear.
- **Alert:** "Gripper service recommended after N cycles."

---

## 10. Deployment

### 10.1 Deployment Workflow

| Phase | Activity | Duration |
|-------|----------|----------|
| 1 | Site survey: CNC type, I/O available, workspace, part size | 1 day |
| 2 | Mechanical installation: mount gantry/arm, trays, sensors | 2-3 days |
| 3 | Electrical: wiring, E-stop, interlocks, power | 1-2 days |
| 4 | Software: flash MCU, install Pi image, configure IP, machine ID | 0.5 day |
| 5 | CNC integration: connect I/O, test cycle complete / cycle start | 0.5 day |
| 6 | Vision calibration: capture reference images, set ROI, thresholds | 1 day |
| 7 | Teach positions: chuck, magazine, output tray (via teach pendant or config) | 1 day |
| 8 | Dry run: run state machine without parts, verify all transitions | 0.5 day |
| 9 | Production trial: run with parts, tune speeds, retries, timeouts | 1-2 days |
| 10 | Operator training, documentation handover | 0.5 day |

**Total:** ~8-12 working days for first machine.

### 10.2 Calibration Procedures

- **Robot positioning:** Use fixed reference (e.g., chuck center); teach pick/place points; store in mm.
- **Vision:** Capture 10-20 images per part type; tune threshold, min area; validate on test set.
- **Gripper force:** Adjust pressure so parts are held firmly without damage; record setting.

### 10.3 Maintenance Schedule

| Item | Frequency |
|------|-----------|
| Clean lens, check lighting | Weekly |
| Inspect gripper jaws, seals | Monthly |
| Check belt tension (if belt-driven) | Monthly |
| Lubricate linear rails | Quarterly |
| Verify limit switches, E-stop | Monthly |
| Backup config and logs | Weekly |

---

## 11. Cost Optimization

| Strategy | Impact |
|----------|--------|
| **Open-source software** | Zero licensing (Python, OpenCV, Linux, MQTT) |
| **Off-the-shelf components** | Avoid custom PCBs initially; use Arduino/ESP32 shields |
| **Modular arm** | Start with 2-3 axis gantry; add DOF only if needed |
| **Simplified vision** | Binary threshold + contour for many parts; reserve YOLO for complex cases |
| **Single camera** | One camera for chuck and magazine if FOV allows |
| **Manual door** | Skip door actuator; use sensor only; saves Rs3,000-8,000 |
| **Bulk sourcing** | 10-15% savings on sensors, motors if building multiple units |

---

## 12. Expected Impact

| Metric | Conservative Estimate |
|--------|------------------------|
| **Machine idle time reduction** | 15-25% (manual load ~2-5 min/cycle -> automated ~30-60 s) |
| **Throughput increase** | 10-20% (more cycles per shift) |
| **Operator safety** | Fewer hand entries into machining zone |
| **Consistency** | More repeatable placement; less scrap from misload |
| **ROI (mid-range build Rs60k)** | 12-24 months at 1-2 shifts, assuming labor cost Rs15-20k/month and ~20% productivity gain |

*Actual ROI depends on cycle time, labor cost, and utilization.*

---

## 13. Deliverables Summary

| Deliverable | Description |
|-------------|-------------|
| **System architecture diagram** | Section 4.1 (software), Section 3.1 (hardware) |
| **Hardware block diagram** | Section 3.1 |
| **Control flow diagram** | Section 6.1 (state machine) |
| **Cost estimation table** | Section 3.4 |
| **Pseudocode** | Section 6.2 |
| **Recommended hardware list** | Section 3.2 |
| **Deployment workflow** | Section 10.1 |

---

## Appendix A: Recommended Hardware List (Consolidated)

| Item | Spec | Qty | Est. Rs |
|------|------|-----|--------|
| Raspberry Pi 4 4GB | With power supply, case | 1 | 5,500 |
| ESP32 DevKit or Arduino Mega | With USB cable | 1 | 800 |
| NEMA17 stepper + TB6600 | 1.8 deg, 0.4 Nm | 3+driver | 3,000 |
| Linear rail 8mm + block | 300 mm | 2 | 2,000 |
| Lead screw 8mm, 2 mm pitch | 300 mm | 2 | 800 |
| Pneumatic gripper + valve | 10-20 mm stroke | 1 | 3,500 |
| Proximity sensor 12 mm | NPN NO | 2 | 600 |
| Limit switch | Mechanical | 6 | 400 |
| IR break-beam | 5-50 cm | 2 | 400 |
| USB camera 1080p | Logitech C920 or similar | 1 | 2,500 |
| LED ring light | 12V, adjustable | 1 | 800 |
| E-stop | Red mushroom, NC | 1 | 500 |
| 24V 5A PSU | Switched | 1 | 1,000 |
| Enclosure, cabling, misc | - | - | 3,000 |
| **Total (approximate)** | | | **~Rs24,800** |

*Add frame fabrication (Rs5k-15k) and contingency for full system.*

---

## Appendix B: Standards and References

- **Modbus RTU:** IEC 61158
- **Safety:** ISO 13849-1 (PLr), IEC 62061
- **Machine vision:** OpenCV documentation, ultralytics YOLO
- **Motion:** Trapezoidal profile: standard in CNC and robotics (NIST, IEEE)

---

*Document version: 1.0 | For SME CNC automation | All components and algorithms are commercially available and industrially proven.*
