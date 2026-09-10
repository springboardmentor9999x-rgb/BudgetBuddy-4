function DashboardCard({



    title,



    value,



    color



}) {



    return (



        <div className="col-md-4 mb-3">



            <div

                className={`card shadow border-start border-4 border-${color}`}

            >



                <div className="card-body">



                    <h6 className="text-muted">



                        {title}



                    </h6>



                    <h3>



                        {value}



                    </h3>



                </div>



            </div>



        </div>



    );



}



export default DashboardCard;