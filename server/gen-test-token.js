const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, username: 'test', email: 'test@test.com' }, 'vitalwounds-secret-key', { expiresIn: '1h' });
console.log(token);
