import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function GroupBalancesPieChart({ balances, type }) {
  const users = Object.keys(balances);

  // Choose which data to display based on type
  const dataValues =
    type === "owedToUser"
      ? users.map((u) => balances[u].owedToUser || 0)
      : users.map((u) => balances[u].owedByUser || 0);

  // If all values are zero, show a message instead
  const allZero = dataValues.every((val) => val === 0);
  if (allZero) {
    return (
      <div className="w-64 h-64 flex items-center justify-center text-gray-500 text-center">
        No {type === "owedToUser" ? "one owes you" : "debts"} to display
      </div>
    );
  }

  const chartTitle = type === "owedToUser" ? "Owes You" : "Owed by You";

  const data = {
    labels: users,
    datasets: [
      {
        label: chartTitle,
        data: dataValues,
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40"
        ],
        borderWidth: 1
      }
    ]
  };

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
      labels: { boxWidth: 20, padding: 15 },
    },
    title: { display: true, text: chartTitle, font: { size: 16 } },
    tooltip: { enabled: true },
  },
};


  return <div className="w-64 h-64 mx-auto"><Pie data={data} options={options} /></div>;
}
