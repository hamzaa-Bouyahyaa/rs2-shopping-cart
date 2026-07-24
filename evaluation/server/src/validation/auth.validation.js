// Login payload rules. Field lengths follow the User table from the brief:
// LoginName and Password are both Varchar2(20).

const LOGIN_FIELD_MAX_LENGTH = 20;

function isValidLoginField(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= LOGIN_FIELD_MAX_LENGTH
  );
}

function validateLogin({ loginName, password } = {}) {
  if (!isValidLoginField(loginName)) {
    return `Login name must be 1 to ${LOGIN_FIELD_MAX_LENGTH} characters.`;
  }
  if (!isValidLoginField(password)) {
    return `Password must be 1 to ${LOGIN_FIELD_MAX_LENGTH} characters.`;
  }
  return null;
}

module.exports = { LOGIN_FIELD_MAX_LENGTH, isValidLoginField, validateLogin };
