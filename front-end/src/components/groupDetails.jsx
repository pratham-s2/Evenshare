import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import TransactionOthers from "./transactionOthers";
import TransactionSelf from "./transactionSelf";
import { SquarePlus, Check, Group } from "lucide-react";
import AddTransactionModal from "./addTransactionModal";
import GroupBalancesPieChart from "./groupBalancesChart";

function GroupDetails() {
  const params = useParams();
  const group_id = params.group_id;
  const [groupMembers, setGroupMembers] = useState([]);
  const [addTransactionModal, setAddTransactionModal] = useState(false);
  const [selfTransactions, setSelfTransactions] = useState([]);
  const [othersTransactions, setOthersTransactions] = useState([]);
  const [groupDetails, setGroupDetails] = useState([]);
  const [showTransactionsByOthers, setShowTransactionsByOthers] = useState(true);
  const [totalBalances, setTotalBalances] = useState([])

  const [months, setMonths] = useState([]); // available months
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0); // pagination index

  const navigate = useNavigate();

  async function initializeGroupDetails() {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/groups/details?group_id=${group_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const responseData = await response.json();
    console.log(responseData);

    if (responseData.status == "success") {
      setSelfTransactions(responseData.transactions_self);
      setOthersTransactions(responseData.transactions_others);
      setGroupDetails(responseData.groupResults[0]);
      setGroupMembers(responseData.groupMembers.map((element) => element.user));
      //create an object with keys (user_id, balance) and value of total balance starting at 0. this will go up as we iterate through the values
      // from the self and others data. We will keep track of how much a user owes this user as well as how much this user owes others.
      //two keys, owed to and owed
      // Collect unique months from both self and others
      const balances_temp = {}

      for (const user of responseData.groupMembers){
        balances_temp[user.user] = {owedToUser: 0, owedByUser: 0}
      }

      for (const transaction of responseData.transactions_others){
        balances_temp[transaction.creator_id].owedByUser += transaction.balance_amount
      }

      for (const transaction of responseData.transactions_self){
        for (const balance of transaction.balances){
          // Only add balance if the assignee is not the same as the creator
          if (balance.assignee_id !== transaction.creator_id) {
            balances_temp[balance.assignee_id].owedToUser += balance.balance_amount
          }
        }
      }
      setTotalBalances(balances_temp)
      console.log(balances_temp)

      const allDates = [
        ...responseData.transactions_self.map((t) => t.date_edited),
        ...responseData.transactions_others.map((t) => t.date_edited),
      ];

      const uniqueMonths = Array.from(
        new Set(
          allDates.map((d) => {
            const date = new Date(d);
            return `${date.getFullYear()}-${date.getMonth()}`;
          })
        )
      ).sort((a, b) => (a < b ? 1 : -1)); // newest first

      setMonths(uniqueMonths);
      setCurrentMonthIndex(0);
    }
  }

  async function handleDeleteTransaction({ transaction_id }) {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/groups/details/transactions/delete`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_id: transaction_id,
        }),
      }
    );

    const responseData = await response.json();

    if (responseData.success) {
      initializeGroupDetails();
      return true;
    } else {
      return false;
    }
  }

  async function onPay({ payAmount, transaction_id }) {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/groups/details/transactions/pay`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pay_amount: payAmount,
          transaction_id: transaction_id,
        }),
      }
    );

    const responseData = await response.json();

    if (responseData.success) {
      initializeGroupDetails();
      return true;
    } else {
      return false;
    }
  }

  useEffect(() => {
    initializeGroupDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleOpenTransactionModal() {
    if (groupMembers.length > 0) {
      setAddTransactionModal(true);
    } else {
      console.log("Error: group members not loaded");
    }
  }

  function filterTransactionsByMonth(transactions) {
    if (months.length === 0) return [];
    const [year, month] = months[currentMonthIndex].split("-");
    return transactions.filter((t) => {
      const date = new Date(t.date_edited);
      return (
        date.getFullYear().toString() === year &&
        date.getMonth().toString() === month
      );
    });
  }

  const monthLabel =
    months.length > 0
      ? new Date(
          parseInt(months[currentMonthIndex].split("-")[0]),
          parseInt(months[currentMonthIndex].split("-")[1])
        ).toLocaleString("default", { month: "long", year: "numeric" })
      : "";

  return (
    <div className="mt-3">
      <div className="flex flex-row justify-between items-center px-10">
        <h1 className="text-xl font-semibold">
          <button
            className="hover:underline"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>{" "}
          {" > "}
          {groupDetails.group_name?.toString()}
        </h1>
        <button
          className="bg-blue-700 hover:bg-blue-500 text-gray-50 text-lg rounded-lg px-8 py-2 flex flex-row gap-3 items-center"
          onClick={() => handleOpenTransactionModal()}
        >
          New Transaction <SquarePlus className="inline" />
        </button>
      </div>

      <div className="flex flex-row justify-around gap-3 py-3">
        <div className="grow-2">
          <h1 className="text-xl font-semibold text-center">Summary</h1>
          <hr className="border-t border-gray-200 my-2"></hr>
          <div className="flex flex-col justify-around">
          {/* Summary Table */}
          <div className="w-full">
            <h2 className="text-xl font-semibold text-center mb-2">Group Balances</h2>
            <div className="overflow-x-auto px-2">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 border-b text-left">User</th>
                    <th className="px-3 py-2 border-b text-right">Owes You</th>
                    <th className="px-3 py-2 border-b text-right">Owed by You</th>
                    <th className="px-3 py-2 border-b text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(totalBalances).map(([user, data]) => {
                    const netBalance = data.owedByUser - data.owedToUser;
                    return (
                      <tr key={user} className="hover:bg-gray-50">
                        <td className="px-3 py-2 border-b font-medium break-words max-w-xs">{user}</td>
                        <td className="px-3 py-2 border-b text-red-600 text-right">${data.owedToUser.toFixed(2)}</td>
                        <td className="px-3 py-2 border-b text-green-600 text-right">${data.owedByUser.toFixed(2)}</td>
                        <td className={`px-3 py-2 border-b font-semibold text-right ${netBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
                          ${netBalance.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
      <div className="flex flex-wrap justify-around mt-6 gap-6">
        {totalBalances && Object.keys(totalBalances).length > 0 && (
          <>
            <div className="flex flex-col items-center flex-1 w-1/3">
              <h3 className="text-center font-medium">Owes You</h3>
              <div className="w-full">
                <GroupBalancesPieChart balances={totalBalances} type="owedToUser" />
              </div>
            </div>

            <div className="flex flex-col items-center flex-1 w-1/3">
              <h3 className="text-center font-medium">Owed by You</h3>
              <div className="w-full">
                <GroupBalancesPieChart balances={totalBalances} type="owedByUser" />
              </div>
            </div>
          </>
        )}
      </div>


          </div>
        </div>

        <div className="grow-2 px-5">
          <h1 className="text-xl font-semibold text-center">Transactions</h1>
          <hr className="border-t border-gray-200 my-2"></hr>

          {/* Tabs */}
          <div className="flex flex-row gap-4 py-2">
            <button
              className={`px-3 py-2 hover:shadow border-gray-300 border rounded-lg transition duration-500 
                ${
                  showTransactionsByOthers
                    ? "text-white bg-gray-700 hover:bg-gray-600"
                    : "bg-white text-black hover:bg-gray-100"
                } 
                flex flex-row items-center gap-2`}
              onClick={() => setShowTransactionsByOthers(true)}
            >
              {showTransactionsByOthers && (
                <Check className="w-5 h-5 mt-[2px]" />
              )}
              By Others
            </button>

            <button
              className={`px-3 py-2 hover:shadow border-gray-300 border rounded-lg transition duration-500 
                ${
                  !showTransactionsByOthers
                    ? "text-white bg-gray-700 hover:bg-gray-600"
                    : "bg-white text-black hover:bg-gray-100"
                } 
                flex flex-row items-center gap-2`}
              onClick={() => setShowTransactionsByOthers(false)}
            >
              {!showTransactionsByOthers && (
                <Check className="w-5 h-5 mt-[2px]" />
              )}
              By Me
            </button>
          </div>

          {/* Month Pagination */}
          {months.length > 0 && (
            <div className="flex flex-row justify-between items-center my-3">
              <button
                disabled={currentMonthIndex === months.length - 1}
                onClick={() => setCurrentMonthIndex(currentMonthIndex + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {"< Prev"}
              </button>
              <span className="font-semibold">{monthLabel}</span>
              <button
                disabled={currentMonthIndex === 0}
                onClick={() => setCurrentMonthIndex(currentMonthIndex - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {"Next >"}
              </button>
            </div>
          )}

          {/* Transaction List */}
          <div className="overflow-y-auto max-h-120">
            {showTransactionsByOthers &&
              (filterTransactionsByMonth(othersTransactions).length > 0 ? (
                filterTransactionsByMonth(othersTransactions).map(
                  (transaction) => (
                    <TransactionOthers
                      name={transaction.transaction_name}
                      key={transaction.transaction_id}
                      total_amount={transaction.amount}
                      balance_amount={transaction.balance_amount}
                      creator_id={transaction.creator_id}
                      transaction_id={transaction.transaction_id}
                      date={transaction.date_edited}
                      current_user_id={transaction.assignee_id}
                      description={transaction.transaction_description.slice(
                        0,
                        100
                      )}
                      onPay={onPay}
                    />
                  )
                )
              ) : (
                <p className="text-gray-700">
                  No transactions this month.
                </p>
              ))}

            {!showTransactionsByOthers &&
              (filterTransactionsByMonth(selfTransactions).length > 0 ? (
                filterTransactionsByMonth(selfTransactions).map((transaction) => (
                  <TransactionSelf
                    key={transaction.transaction_id}
                    name={transaction.name}
                    total_amount={transaction.total_amount}
                    description={transaction.description}
                    transaction_id={transaction.transaction_id}
                    date={transaction.date_edited}
                    balances={transaction.balances}
                    creator_id={transaction.creator_id}
                    handleDeleteTransaction={handleDeleteTransaction}
                    group_id={group_id}
                    group_members={groupMembers}
                    initializeGroupDetails={initializeGroupDetails}
                  />
                ))
              ) : (
                <p className="text-gray-700">No transactions this month.</p>
              ))}
          </div>
        </div>
      </div>

      {addTransactionModal && groupMembers.length > 0 && (
        <AddTransactionModal
          onClose={() => {
            setAddTransactionModal(false);
            initializeGroupDetails();
          }}
          group_id={group_id}
          groupMembers={groupMembers}
        />
      )}
    </div>
  );
}

export default GroupDetails;
