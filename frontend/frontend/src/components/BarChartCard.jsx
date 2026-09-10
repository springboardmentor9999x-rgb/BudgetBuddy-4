import{



ResponsiveContainer,



BarChart,



Bar,



XAxis,



YAxis,



CartesianGrid,



Tooltip



}from"recharts";



function BarChartCard({data, title = "Income vs Expense"}){



return(



<div className="card shadow p-3">



<h4>



{title}



</h4>



<ResponsiveContainer



width="100%"



height={320}



>



<BarChart data={data}>



<CartesianGrid strokeDasharray="3 3"/>



<XAxis dataKey="name"/>



<YAxis/>



<Tooltip/>



<Bar



dataKey="amount"



fill="#0d6efd"



/>



</BarChart>



</ResponsiveContainer>



</div>



);



}



export default BarChartCard;