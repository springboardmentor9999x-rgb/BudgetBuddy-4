import{



PieChart,



Pie,



Tooltip,



Legend,



ResponsiveContainer



}from"recharts";



function ExpensePieChart({data}){



return(



<div className="card shadow p-3">



<h4>Expense Categories</h4>



<ResponsiveContainer width="100%" height={300}>



<PieChart>



<Pie



data={data}



dataKey="amount"



nameKey="category"



outerRadius={110}



fill="#2563eb"



/>



<Tooltip/>



<Legend/>



</PieChart>



</ResponsiveContainer>



</div>



);



}



export default ExpensePieChart;