import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'supportmind.db');
export const db = new DatabaseSync(dbPath);

// Initialize SQLite Tables according to specification
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      machine_name TEXT NOT NULL,
      model TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      location TEXT NOT NULL,
      installation_date TEXT NOT NULL,
      status TEXT NOT NULL,
      operating_environment TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      issue TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      resolution TEXT,
      outcome TEXT
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT,
      customer_id TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      user_message TEXT NOT NULL,
      agent_response TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Hindsight persistent memory backing store
    CREATE TABLE IF NOT EXISTS hindsight_memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_id TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      memory_type TEXT NOT NULL, -- 'episodic', 'semantic', 'procedural'
      category TEXT NOT NULL,    -- 'failure', 'resolution', 'preference', 'environment', 'symptom'
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      details TEXT NOT NULL,     -- JSON string
      confidence REAL DEFAULT 0.95,
      event_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      tags TEXT NOT NULL         -- JSON array of strings
    );
  `);

  // Check if customers table is populated, if not, auto-seed
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM customers');
  const result = checkStmt.get() as { count: number };
  if (result.count === 0) {
    seedDatabase();
  }
}

export function resetDatabase() {
  db.exec(`
    DELETE FROM interactions;
    DELETE FROM tickets;
    DELETE FROM machines;
    DELETE FROM customers;
    DELETE FROM hindsight_memories;
  `);
  seedDatabase();
}

export function seedDatabase() {
  const now = new Date().toISOString();

  // 1. Seed Customers
  const insertCustomer = db.prepare(`
    INSERT OR REPLACE INTO customers (customer_id, company_name, contact_name, email, phone, location, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertCustomer.run(
    'CUST-001',
    'ACME Manufacturing',
    'Marcus Vance (Plant Operations Lead)',
    'm.vance@acmemfg-demo.com',
    '+1 (555) 234-8891',
    'Detroit, MI - Facility A',
    '2024-01-10T08:00:00Z'
  );

  insertCustomer.run(
    'CUST-002',
    'Vertex Components',
    'Elena Rostova (Lead Maintenance Tech)',
    'e.rostova@vertexcomp-demo.com',
    '+1 (555) 389-4412',
    'Cleveland, OH - Plant 3',
    '2024-02-15T09:30:00Z'
  );

  insertCustomer.run(
    'CUST-003',
    'Nova Industrial Systems',
    'David Chen (Automation Supervisor)',
    'd.chen@novasystems-demo.com',
    '+1 (555) 912-7703',
    'Austin, TX - Automation Hub',
    '2024-03-01T11:00:00Z'
  );

  // 2. Seed Machines
  const insertMachine = db.prepare(`
    INSERT OR REPLACE INTO machines (machine_id, customer_id, machine_name, model, manufacturer, location, installation_date, status, operating_environment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMachine.run(
    'CNC-M102',
    'CUST-001',
    'DMG MORI 5-Axis Precision Mill',
    'DMU 50 3rd Gen',
    'DMG MORI',
    'Cell 4, Heavy Machining Bay',
    '2024-03-15',
    'Warning',
    'Continuous 3-shift operation, high ambient humidity, aluminum & titanium swarf generation'
  );

  insertMachine.run(
    'CNC-M205',
    'CUST-001',
    'Haas Vertical Machining Center',
    'VF-4SS Super-Speed',
    'Haas Automation',
    'Cell 2, Tooling Suite',
    '2023-11-20',
    'Operational',
    'Climate-controlled precision tooling cell, dry air lubrication system'
  );

  insertMachine.run(
    'PRESS-P14',
    'CUST-002',
    '500-Ton Hydraulic Stamping Press',
    'MSP 500-Servo',
    'Schuler Group',
    'Press Hall B',
    '2022-08-10',
    'Warning',
    'Heavy stamping floor, elevated oil temperatures, cyclical high vibration'
  );

  insertMachine.run(
    'LATHE-L07',
    'CUST-002',
    'CNC Slant-Bed Turning Center',
    'QuickTurn 250MSY',
    'Mazak',
    'Turning Bay 1',
    '2024-01-18',
    'Operational',
    'High-throughput shaft turning, water-soluble flood coolant'
  );

  insertMachine.run(
    'ROBOT-R21',
    'CUST-003',
    '6-Axis Articulated Welding Robot',
    'M-20iD/35',
    'FANUC',
    'Robotic Cell Alpha',
    '2024-06-02',
    'Operational',
    'Automated MIG welding bay, high thermal radiation, heavy spatter'
  );

  // 3. Seed Realistic Historical Tickets
  const insertTicket = db.prepare(`
    INSERT OR REPLACE INTO tickets (ticket_id, customer_id, machine_id, issue, severity, status, created_at, resolved_at, resolution, outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTicket.run(
    'TCK-1021',
    'CUST-001',
    'CNC-M102',
    'Spindle thermal runaway alarm ERR-402 during 3rd shift cycle',
    'High',
    'Resolved',
    '2024-08-12T14:22:00Z',
    '2024-08-12T18:45:00Z',
    'Diagnosed auxiliary cooling fan failure. Tested coolant flow (normal). Replaced auxiliary brushless 24V cooling fan assembly (Part #CF-882).',
    'Problem resolved. Spindle operational temperature stabilized at 42°C under full 18,000 RPM load.'
  );

  insertTicket.run(
    'TCK-1044',
    'CUST-001',
    'CNC-M102',
    'Excessive spindle vibration warning ERR-118 at harmonic frequencies',
    'Medium',
    'Resolved',
    '2024-08-29T10:15:00Z',
    '2024-08-29T13:30:00Z',
    'Inspected ceramic spindle bearings. Flushed bearing lubrication channel and replenished with synthetic ISO VG 32 spindle oil.',
    'Vibration velocity dropped from 3.8 mm/s to 0.72 mm/s, well within ISO 10816 acceptable tolerance.'
  );

  insertTicket.run(
    'TCK-1088',
    'CUST-001',
    'CNC-M102',
    'Recurrent thermal alarm ERR-402 on heavy face-milling pass',
    'High',
    'Resolved',
    '2024-09-15T16:05:00Z',
    '2024-09-15T17:50:00Z',
    'Recalled previous Aug 12 fan issue. Inspected cooling duct and discovered severe aluminum swarf clogging intake filter. Cleared mesh filter and verified fan RPM.',
    'Thermals restored to 44°C. Swarf baffle shield adjusted to prevent particulate ingestion.'
  );

  insertTicket.run(
    'TCK-1052',
    'CUST-001',
    'CNC-M205',
    'X-Axis positioning error & audible harmonic resonance',
    'Medium',
    'Resolved',
    '2024-08-22T08:30:00Z',
    '2024-08-22T11:40:00Z',
    'Checked ball screw backlash. Adjusted gib tension on X-axis linear guideways and calibrated pre-load nuts.',
    'Backlash minimized to 0.003mm, machine returned to active production.'
  );

  insertTicket.run(
    'TCK-1065',
    'CUST-002',
    'PRESS-P14',
    'Hydraulic pressure drop below 140 bar during blanking stroke',
    'High',
    'Resolved',
    '2024-09-02T13:10:00Z',
    '2024-09-02T16:20:00Z',
    'Identified return line particulate filter clogging. Replaced 10-micron hydraulic filter element and purged hydraulic fluid reservoir.',
    'System pressure restored to rated 210 bar holding pressure.'
  );

  // 4. Seed Historical Interactions
  const insertInteraction = db.prepare(`
    INSERT OR REPLACE INTO interactions (ticket_id, customer_id, machine_id, user_message, agent_response, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertInteraction.run(
    'TCK-1021',
    'CUST-001',
    'CNC-M102',
    'M102 spindle temperature is hitting 78°C and tripping ERR-402 on heavy cycles. Can we bypass the sensor?',
    'NEVER bypass thermal cutoff sensors on the DMG MORI DMU 50. High spindle temps exceeding 75°C risk permanent spindle bearing seizure and fire hazard. Recommended safe procedure: 1. Safely stop the spindle. 2. Verify coolant delivery line pressure. 3. Check if the auxiliary 24V cooling fan is spinning or stalled.',
    '2024-08-12T14:25:00Z'
  );

  insertInteraction.run(
    'TCK-1088',
    'CUST-001',
    'CNC-M102',
    'M102 is overheating again today during titanium face milling.',
    'Recalling previous incident from August 12: cooling fan failure previously triggered ERR-402. Let us inspect the cooling circuit immediately. Before replacing components, check whether fine swarf has clogged the air intake filter mesh on the top cowling.',
    '2024-09-15T16:10:00Z'
  );

  // 5. Seed Real Hindsight Persistent Memories
  // Note: These represent persistent memories accumulated in the Hindsight memory layer
  const insertMemory = db.prepare(`
    INSERT OR REPLACE INTO hindsight_memories (
      memory_id, customer_id, machine_id, memory_type, category, title, summary, details, confidence, event_date, created_at, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMemory.run(
    'MEM-HIN-001',
    'CUST-001',
    'CNC-M102',
    'episodic',
    'failure',
    'Previous Overheating Incident & Cooling Fan Replacement',
    'On August 12, CNC-M102 suffered ERR-402 overheating at 78°C due to auxiliary cooling fan motor failure. Replacing fan assembly (Part #CF-882) fully restored normal operating temperature (42°C).',
    JSON.stringify({
      incident_date: '2024-08-12',
      symptoms: ['Spindle temperature 78°C', 'Alarm ERR-402', 'High duty cycle'],
      failed_solutions: ['Coolant reservoir topping (coolant flow was already adequate)'],
      successful_solution: 'Auxiliary cooling fan replacement',
      resolved: true,
      technician: 'Marcus Vance'
    }),
    0.98,
    '2024-08-12',
    now,
    JSON.stringify(['overheating', 'cooling_fan', 'ERR-402', 'spindle', 'thermal'])
  );

  insertMemory.run(
    'MEM-HIN-002',
    'CUST-001',
    'CNC-M102',
    'episodic',
    'failure',
    'Intake Filter Swarf Blockage Thermal Event',
    'On September 15, CNC-M102 registered high temperatures due to fine aluminum & titanium swarf clogging the cooling air intake mesh. Cleaning the mesh filter and adjusting the baffle cleared the issue.',
    JSON.stringify({
      incident_date: '2024-09-15',
      symptoms: ['Overheating during titanium face milling', 'Reduced airflow'],
      root_cause: 'Particulate intake clogging from swarf',
      successful_solution: 'Intake filter mesh washdown and swarf deflector shield adjustment',
      resolved: true
    }),
    0.95,
    '2024-09-15',
    now,
    JSON.stringify(['overheating', 'air_filter', 'swarf', 'airflow', 'titanium'])
  );

  insertMemory.run(
    'MEM-HIN-003',
    'CUST-001',
    'CNC-M102',
    'episodic',
    'maintenance',
    'Spindle Harmonic Vibration Bearing Lubrication Event',
    'On August 29, CNC-M102 had vibration warning ERR-118. Tool rebalancing did not eliminate it; flushing bearing lubrication channel and replenishing with synthetic ISO VG 32 brought vibration down to 0.72 mm/s.',
    JSON.stringify({
      incident_date: '2024-08-29',
      symptoms: ['ERR-118 vibration', 'Harmonic resonance at 12,000 RPM'],
      successful_solution: 'Flushed lubrication and applied ISO VG 32 synthetic spindle oil',
      outcome: 'Vibration velocity 0.72 mm/s'
    }),
    0.92,
    '2024-08-29',
    now,
    JSON.stringify(['vibration', 'bearing', 'lubrication', 'ERR-118', 'spindle'])
  );

  insertMemory.run(
    'MEM-HIN-004',
    'CUST-001',
    'CNC-M102',
    'procedural',
    'preference',
    'Customer Operational Protocol: ACME Manufacturing',
    'Customer contact Marcus Vance strictly requests step-by-step diagnostic checklists and mandates full electrical Lockout/Tagout (LOTO) verification prior to any enclosure inspection.',
    JSON.stringify({
      preferred_format: 'Numbered sequential steps',
      safety_priority: 'Strict Lockout/Tagout (LOTO)',
      technical_depth: 'Advanced industrial maintenance level'
    }),
    0.99,
    '2024-07-01',
    now,
    JSON.stringify(['preference', 'checklist', 'LOTO', 'safety_protocol'])
  );

  insertMemory.run(
    'MEM-HIN-005',
    'CUST-001',
    'CNC-M102',
    'semantic',
    'environment',
    'Operational Context: Heavy 3-Shift Machining Bay Cell 4',
    'CNC-M102 runs on continuous 3-shift rotation with heavy cutting loads on hardened aerospace alloys. Ambient facility temperatures can reach 34°C in summer afternoons.',
    JSON.stringify({
      duty_cycle: '24/7 continuous 3-shift',
      ambient_temp_peak: '34°C',
      materials_processed: ['Titanium Ti-6Al-4V', 'Inconel 718', '7075 Aluminum']
    }),
    0.94,
    '2024-03-20',
    now,
    JSON.stringify(['environment', 'continuous_duty', 'high_ambient_temp', 'aerospace'])
  );

  insertMemory.run(
    'MEM-HIN-006',
    'CUST-002',
    'PRESS-P14',
    'episodic',
    'failure',
    'Hydraulic Filter Blockage & Pressure Drop',
    'On September 2, PRESS-P14 experienced a sudden pressure drop from 210 bar to 135 bar during blanking stroke. Proportional valve was functional; 10-micron return line filter was clogged with degraded hydraulic sludge. Replacing the cartridge resolved the issue.',
    JSON.stringify({
      incident_date: '2024-09-02',
      symptoms: ['Pressure drop to 135 bar', 'Cycle delay'],
      successful_solution: 'Replaced 10-micron hydraulic return filter cartridge and purged fluid',
      resolved: true
    }),
    0.96,
    '2024-09-02',
    now,
    JSON.stringify(['hydraulic', 'pressure_drop', 'filter_blockage', 'press'])
  );

  insertMemory.run(
    'MEM-HIN-007',
    'CUST-001',
    'CNC-M205',
    'episodic',
    'resolution',
    'X-Axis Positioning Backlash Calibration',
    'On August 22, CNC-M205 exhibited 0.025mm X-axis backlash. Gib adjustment and pre-load nut recalibration brought backlash down to 0.003mm.',
    JSON.stringify({
      incident_date: '2024-08-22',
      successful_solution: 'Gib tension calibration & ball screw pre-load adjustment',
      resolved: true
    }),
    0.91,
    '2024-08-22',
    now,
    JSON.stringify(['backlash', 'axis', 'calibration', 'haas'])
  );
}
