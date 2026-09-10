import { Link } from "react-router-dom";



function NotFound() {



    return (



        <div

            className="container text-center"

            style={{ marginTop: "120px" }}

        >



            <h1

                style={{

                    fontSize: "90px",

                    fontWeight: "bold",

                    color: "#0d6efd"

                }}

            >

                404

            </h1>



            <h3>



                Page Not Found



            </h3>



            <p>



                The page you are looking for does not exist.



            </p>



            <Link

                to="/dashboard"

                className="btn btn-primary mt-3"

            >



                Go to Dashboard



            </Link>



        </div>



    );



}



export default NotFound;