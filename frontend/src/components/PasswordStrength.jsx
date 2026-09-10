import {

  getPasswordStrength,

  getStrengthLabel,

} from "../utils/validators";



function PasswordStrength({ password }) {



  const strength =

    getPasswordStrength(password);



  const label =

    getStrengthLabel(strength);



  const percentage =

    (strength / 5) * 100;



  let color = "#dc3545";



  if (label === "Medium")

    color = "#ffc107";



  if (label === "Strong")

    color = "#198754";



  return (



    <div className="mb-3">



      <small>



        Password Strength :

        <strong

          style={{

            color: color,

            marginLeft: 5,

          }}

        >

          {label}

        </strong>



      </small>



      <div

        style={{

          width: "100%",

          height: "8px",

          background: "#ddd",

          borderRadius: "10px",

          marginTop: "6px",

        }}

      >



        <div

          style={{

            width: `${percentage}%`,

            height: "100%",

            background: color,

            borderRadius: "10px",

            transition: ".3s",

          }}

        ></div>



      </div>



      <small

        className="text-muted"

      >



        Password must contain:



        <br />



        ✔ 8 Characters



        <br />



        ✔ Uppercase Letter



        <br />



        ✔ Lowercase Letter



        <br />



        ✔ Number



        <br />



        ✔ Special Character



      </small>



    </div>



  );

}



export default PasswordStrength;