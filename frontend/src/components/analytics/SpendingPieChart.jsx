import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


// =========================================================
// Pie Chart Colors
// =========================================================

const COLORS = [
  "#2563EB", // Blue
  "#10B981", // Green
  "#F59E0B", // Orange
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
];


function SpendingPieChart({ data }) {

  return (

    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-xl font-bold mb-4">
        Spending by Category
      </h2>


      {data.length === 0 ? (

        <p className="text-gray-500">
          No expense data available.
        </p>

      ) : (

        <ResponsiveContainer
          width="100%"
          height={300}
        >

          <PieChart>

            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >

              {data.map(
                (entry, index) => (

                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS[
                      index %
                      COLORS.length
                      ]
                    }
                  />

                )
              )}

            </Pie>


            <Tooltip />


            <Legend />

          </PieChart>

        </ResponsiveContainer>

      )}

    </div>

  );
}


export default SpendingPieChart;