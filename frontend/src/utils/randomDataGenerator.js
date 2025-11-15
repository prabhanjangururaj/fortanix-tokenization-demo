// Realistic random data generator for demo purposes

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
  'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley',
  'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle',
  'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Dorothy', 'Timothy', 'Melissa',
  'Ronald', 'Deborah', 'Edward', 'Stephanie', 'Jason', 'Rebecca', 'Jeffrey', 'Sharon',
  'Ryan', 'Laura', 'Jacob', 'Cynthia', 'Gary', 'Kathleen', 'Nicholas', 'Amy',
  'Eric', 'Angela', 'Jonathan', 'Shirley', 'Stephen', 'Anna', 'Larry', 'Brenda',
  'Justin', 'Pamela', 'Scott', 'Emma', 'Brandon', 'Nicole', 'Benjamin', 'Helen',
  'Samuel', 'Samantha', 'Raymond', 'Katherine', 'Gregory', 'Christine', 'Frank', 'Debra',
  'Alexander', 'Rachel', 'Patrick', 'Carolyn', 'Raymond', 'Janet', 'Jack', 'Catherine',
  'Dennis', 'Maria', 'Jerry', 'Heather', 'Tyler', 'Diane', 'Aaron', 'Ruth',
  'Jose', 'Julie', 'Adam', 'Olivia', 'Nathan', 'Joyce', 'Henry', 'Virginia',
  'Douglas', 'Victoria', 'Zachary', 'Kelly', 'Peter', 'Lauren', 'Kyle', 'Christina'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell'
];

const emailDomains = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'mail.com', 'zoho.com', 'fastmail.com'
];

const serviceRequests = [
  'account_opening',
  'loan_application',
  'card_request',
  'account_closure',
  'balance_inquiry',
  'fund_transfer'
];

// Helper functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generatePhoneNumber = () => {
  const areaCode = getRandomNumber(200, 999);
  const centralOfficeCode = getRandomNumber(200, 999);
  const lineNumber = getRandomNumber(1000, 9999);
  return `${areaCode}-${centralOfficeCode}-${lineNumber}`;
};

const generateSSN = () => {
  // Generate realistic SSN (avoiding reserved ranges)
  const area = getRandomNumber(1, 899);
  const group = getRandomNumber(1, 99);
  const serial = getRandomNumber(1, 9999);

  return `${String(area).padStart(3, '0')}-${String(group).padStart(2, '0')}-${String(serial).padStart(4, '0')}`;
};

const generateAccountNumber = () => {
  // Generate 10-12 digit account number
  const length = getRandomNumber(10, 12);
  let accountNumber = '';
  for (let i = 0; i < length; i++) {
    accountNumber += getRandomNumber(0, 9);
  }
  return accountNumber;
};

const generatePassportNumber = () => {
  // Generate passport number like 1A2BC4D5 (8 characters, mixed alphanumeric)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';

  let passport = '';
  // Format: digit, letter, digit, letter, letter, digit, letter, digit
  passport += digits[getRandomNumber(0, 9)];
  passport += chars[getRandomNumber(0, 25)];
  passport += digits[getRandomNumber(0, 9)];
  passport += chars[getRandomNumber(0, 25)];
  passport += chars[getRandomNumber(0, 25)];
  passport += digits[getRandomNumber(0, 9)];
  passport += chars[getRandomNumber(0, 25)];
  passport += digits[getRandomNumber(0, 9)];

  return passport;
};

const generateEmail = (firstName, lastName) => {
  const domain = getRandomElement(emailDomains);
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${getRandomNumber(1, 999)}@${domain}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomNumber(1, 99)}@${domain}`
  ];
  return getRandomElement(variations);
};

// Main function to generate random record data
export const generateRandomRecord = () => {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const fullName = `${firstName} ${lastName}`;

  return {
    name: fullName,
    phone: generatePhoneNumber(),
    email: generateEmail(firstName, lastName),
    ssn: generateSSN(),
    accountNumber: generateAccountNumber(),
    passportNumber: generatePassportNumber(),
    serviceRequest: getRandomElement(serviceRequests)
  };
};
