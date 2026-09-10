import {



    ResponsiveContainer,



    BarChart,



    Bar,



    XAxis,



    YAxis,



    CartesianGrid,



    Tooltip,



    Legend



} from "recharts";



/**

 * Generic month-by-month bar chart, used on the Yearly Analysis page for

 * "Monthly Income vs Expense", "Monthly Savings Trend", and

 * "Monthly Budget vs Actual" - one reusable component instead of three

 * near-identical ones.

 *

 * bars: [{ dataKey: "income", name: "Income", color: "#22C55E" }, ...]

 */

function MonthlyBarChart({



    data,



    bars,



    title = "Monthly Overview"



}) {



    return (



        <div className="card shadow p-3">



            <h4>



                {title}



            </h4>



            {data.length === 0 ? (



                <p className="text-muted text-center py-5 mb-0">No data for this period</p>



            ) : (



                <ResponsiveContainer



                    width="100%"



                    height={320}



                >



                    <BarChart data={data}>



                        <CartesianGrid strokeDasharray="3 3" />



                        <XAxis dataKey="month_name" tickFormatter={(v) => v?.slice(0, 3)} />



                        <YAxis />



                        <Tooltip />



                        <Legend />



                        {bars.map((b) => (



                            <Bar



                                key={b.dataKey}



                                dataKey={b.dataKey}



                                fill={b.color}



                                name={b.name}



                            />



                        ))}



                    </BarChart>



                </ResponsiveContainer>



            )}



        </div>



    );



}



export default MonthlyBarChart;