import {



    PieChart,



    Pie,



    Cell,



    Tooltip,



    Legend,



    ResponsiveContainer



} from "recharts";



const COLORS = [



    "#0088FE",



    "#00C49F",



    "#FFBB28",



    "#FF8042",



    "#A855F7",



    "#EC4899",



    "#22C55E",



    "#EF4444"



];



function PieChartCard({



    data,



    title = "Expense Categories"



}) {



    return (



        <div className="card shadow analytics-card">



            <div className="card-body">



                <h4 className="mb-3">



                    {title}



                </h4>



                {data.length === 0 ? (

                    <p className="text-muted text-center py-5 mb-0">No data for this period</p>

                ) : (

                <ResponsiveContainer



                    width="100%"



                    height={320}



                >



                    <PieChart>



                        <Pie



                            data={data}



                            cx="50%"



                            cy="50%"



                            outerRadius={110}



                            dataKey="amount"



                            nameKey="name"



                            label



                        >



                            {



                                data.map((entry, index) => (



                                    <Cell



                                        key={index}



                                        fill={COLORS[index % COLORS.length]}



                                    />



                                ))



                            }



                        </Pie>



                        <Tooltip />



                        <Legend />



                    </PieChart>



                </ResponsiveContainer>

                )}



            </div>



        </div>



    );



}



export default PieChartCard;