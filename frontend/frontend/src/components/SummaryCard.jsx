import { useAppSettings } from "../utils/useAppSettings";

import { formatMoney } from "../utils/settings";



function SummaryCard({



title,



amount,



color



}){



const settings = useAppSettings();



return(



<div className="col-md-4">



<div

className={`card shadow border-${color}`}

>



<div className="card-body">



<h5>



{title}



</h5>



<h2>



{formatMoney(amount, settings?.currency || "INR")}



</h2>



</div>



</div>



</div>



);



}



export default SummaryCard;