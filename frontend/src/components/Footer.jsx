function Footer() {



    const loginTime = localStorage.getItem("loginTime");



    return (



        <footer



            className="text-center mt-5 mb-3"



        >



            <hr />



            <p>



                BudgetBuddy © 2026



            </p>



            <small>



                Last Login : {loginTime}



            </small>



        </footer>



    );



}



export default Footer;