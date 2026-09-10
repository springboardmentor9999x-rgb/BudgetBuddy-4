import { Link } from "react-router-dom";



function QuickActions() {



    return (



        <div className="card shadow p-4">



            <h4 className="mb-3">



                Quick Actions



            </h4>



            <div className="d-flex flex-wrap gap-3">



                <Link

                    to="/income"

                    className="btn btn-success"

                >

                    + Income

                </Link>



                <Link

                    to="/expense"

                    className="btn btn-danger"

                >

                    + Expense

                </Link>



                <Link

                    to="/budget"

                    className="btn btn-primary"

                >

                    Budget

                </Link>



                <Link

                    to="/reports"

                    className="btn btn-dark"

                >

                    Reports

                </Link>





            </div>



        </div>



    );



}



export default QuickActions;