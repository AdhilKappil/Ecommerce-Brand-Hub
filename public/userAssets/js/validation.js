
// ========== for registration ===============
function validRegister() {
    const name = document.getElementById('Fname').value;
    const lname = document.getElementById('Lname').value;
    const email = document.getElementById('email').value;
    const mobile = document.getElementById('mobile').value;
    const password = document.getElementById('password').value;
    const cpassword = document.getElementById('Cpassword').value;
  
    // Clear any previous error messages
    document.getElementById('Fname-error').textContent = '';
    document.getElementById('Lname-error').textContent = '';
    document.getElementById('email-error').textContent = '';
    document.getElementById('mobile-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    document.getElementById('password-mismatch').textContent = '';
  
    if (!name) {
        document.getElementById('Fname-error').textContent = 'First name field should not be empty!';
        return false;
    }
  
    if (!lname) {
        document.getElementById('Lname-error').textContent = 'Last name field should not be empty!';
        return false;
    }
  
  
    if (!email) {
        document.getElementById('email-error').textContent = 'Email field should not be empty!';
        return false;
    }
  
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  
  if (!email || !emailRegex.test(email)) {
      document.getElementById('email-error').textContent = 'Please enter a valid email address. (eg: example@gmail.com)';
      return false;
  }
  
const mobileRegex = /^[6-9]\d{9}$/;

if (!mobile || !mobileRegex.test(mobile)) {
    document.getElementById('mobile-error').textContent = 'Mobile number should be a 10-digit valid number';
    return false;
}

if (new Set(mobile).size === 1) {
    document.getElementById('mobile-error').textContent = 'Mobile number should not consist of the same digit.';
    return false;
}

  
    const passwordRegex = /^(?=.*[!@#$%^&*]).{6,}$/;
  
      if (!password || !passwordRegex.test(password)) {
          document.getElementById('password-error').textContent = 'Password must be at least 6 characters and contain a special character.';
          return false;
      }
  
    if (password !== cpassword) {
        document.getElementById('password-mismatch').textContent = 'Passwords do not match. Please try again.';
        return false;
    }
  
    return true;    
}



// ========== for forgot password ===============
function validForgotPassword() {
    const password = document.getElementById('password').value;
    const cpassword = document.getElementById('Cpassword').value;
  
     // Clear any previous error messages
    document.getElementById('password-error').textContent = '';
    document.getElementById('password-mismatch').textContent = '';
  
    const passwordRegex = /^(?=.*[!@#$%^&*]).{6,}$/;
  
      if (!password || !passwordRegex.test(password)) {
          document.getElementById('password-error').textContent = 'Password must be at least 6 characters and contain a special character.';
          return false;
      }
  
    if (password !== cpassword) {
        document.getElementById('password-mismatch').textContent = 'Passwords do not match. Please try again.';
        return false;
    }
  
    return true;
}



// ========== for address ===============
function validAddress() {
    const name = document.getElementById('fullName').value;
    const mobile = document.getElementById('phone').value;
    const state = document.getElementById('state').value;
    const district = document.getElementById('district').value;
    const city = document.getElementById('city').value;
    const pincode = document.getElementById('pinCode').value;

    document.getElementById('name-error').textContent = '';
    document.getElementById('state-error').textContent = '';
    document.getElementById('mobile-error').textContent = '';
    document.getElementById('district-error').textContent = '';
    document.getElementById('city-error').textContent = '';
    document.getElementById('pincode-error').textContent = '';

    if (!name) {
        document.getElementById('name-error').textContent = 'Name field should not be empty!';
        return false;
    }
    const mobileRegex = /^[6-9]\d{9}$/;

if (!mobile || !mobileRegex.test(mobile)) {
    document.getElementById('mobile-error').textContent = 'Mobile number should be a 10-digit valid number';
    return false;
}

if (new Set(mobile).size === 1) {
    document.getElementById('mobile-error').textContent = 'Mobile number should not consist of the same digit.';
    return false;
}

    if (!state) {
        document.getElementById('state-error').textContent = 'State field should not be empty!';
        return false;
    }


    if (!district) {
        document.getElementById('district-error').textContent = 'District field should not be empty!';
        return false;
    }

    if (!city) {
        document.getElementById('city-error').textContent = 'City field should not be empty!';
        return false;
    }

    const pincodeRegex = /^\d{6}$/;

    if (!pincode || !pincode.match(pincodeRegex)) {
        document.getElementById('pincode-error').textContent = 'Pincode should be a 6-digit numeric value.';
        return false;
    }

    return true;
}



// =========== for state drop down ========
const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const stateDropdown = document.getElementById('state');

indianStates.forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    option.text = state;
    stateDropdown.appendChild(option);
});