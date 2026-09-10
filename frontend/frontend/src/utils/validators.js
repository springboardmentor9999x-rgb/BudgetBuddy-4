// Email Validation



export const validateEmail = (email) => {

  const regex =

    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



  return regex.test(email);

};



// Password Validation



export const validatePassword = (password) => {



  const regex =

    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,}$/;



  return regex.test(password);



};



// Password Strength



export const getPasswordStrength = (password) => {



  let strength = 0;



  if (password.length >= 8)

    strength++;



  if (/[A-Z]/.test(password))

    strength++;



  if (/[a-z]/.test(password))

    strength++;



  if (/\d/.test(password))

    strength++;



  if (/[@$!%*?&^#]/.test(password))

    strength++;



  return strength;



};



// Password Label



export const getStrengthLabel = (strength) => {



  if (strength <= 2)

    return "Weak";



  if (strength <= 4)

    return "Medium";



  return "Strong";



};