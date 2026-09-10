import {



LineChart,



Line,



XAxis,



YAxis,



CartesianGrid,



Tooltip,



ResponsiveContainer



} from "recharts";



function IncomeChart({data}){



return(



<div className="card shadow p-3">



<h4>Income Trend</h4>



<ResponsiveContainer width="100%" height={300}>



<LineChart data={data}>



<CartesianGrid strokeDasharray="3 3"/>



<XAxis dataKey="source"/>



<YAxis/>



<Tooltip/>



<Line



type="monotone"



dataKey="amount"



stroke="#16a34a"



strokeWidth={3}



/>



</LineChart>



</ResponsiveContainer>



</div>



);



}



export default IncomeChart;