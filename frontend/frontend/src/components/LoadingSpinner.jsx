import Spinner from "react-bootstrap/Spinner";



function LoadingSpinner() {



    return (



        <div

            className="d-flex justify-content-center align-items-center"

            style={{

                height: "70vh"

            }}

        >



            <div className="text-center">



                <Spinner

                    animation="border"

                    variant="primary"

                />



                <h5 className="mt-3">



                    Loading...



                </h5>



            </div>



        </div>



    );



}



export default LoadingSpinner;