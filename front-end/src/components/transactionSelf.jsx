import { Trash } from "lucide-react";
import { useState } from "react";
import AddTransactionModal from "./addTransactionModal";

function TransactionSelf({ name, description, date, total_amount, balances, transaction_id, handleDeleteTransaction, group_id, group_members, initializeGroupDetails}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [success, setSuccess] = useState(true)
  

  return (
    <div className="w-full border mx-auto border-gray-300 text-black rounded-xl p-4 mb-4 flex flex-col hover:shadow-md transition relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-lg font-semibold">{name}</h1>
          <p className="text-sm text-gray-600">{description}</p>
          <p className="text-xs text-gray-500 mt-1">
            Last edited: {new Date(date).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <h1 className="text-xl">
            You Paid: <span className="font-bold">${total_amount.toFixed(2)}</span>
          </h1>
          <div className="text-sm text-gray-700">
            {balances &&
              balances.map((balance) => {
                if (balance.balance_amount > 0) {
                  return (
                    <p key={balance.assignee_id}>
                      {balance.assignee_id} owes{" "}
                      <span className="font-semibold text-red-500">
                        ${balance.balance_amount}
                      </span>
                    </p>
                  );
                } else if(balance.balance_amount==0){
                  return (
                    <p key={balance.assignee_id}>
                      {balance.assignee_id} has fully paid you back.
                    </p>
                  );
                }
                else{
                  return (
                    <p key={balance.assignee_id}>
                      You owe {balance.assignee_id} {" "}
                      <span className="font-semibold text-yellow-500">
                        ${Math.abs(balance.balance_amount)}
                      </span>
                    </p>
                  );
                }
              })}
          </div>
        </div>
      </div>
      <hr className="border-t-1 border-gray-200 mb-2" />
      <button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg mx-14 text-white font-bold" onClick={()=>setShowTransactionModal(true)}>
        Edit Transaction 
      </button>
      <button
        className="absolute right-6 bottom-6"
        title="Delete Transaction"
        onClick={() => setShowDeleteModal(true)}
      >
        <Trash className="text-red-500 hover:text-red-600" />
      </button>
      {!success && <p className="text-red-400 text-xs">Something went wrong</p>}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0  z-5 flex items-center justify-center bg-[#00000099] bg-opacity-50" onClick={()=>setShowDeleteModal(false)}>
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg" onClick={(e)=>e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Delete Transaction</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this transaction?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={()=>{
                  let result = handleDeleteTransaction({transaction_id})
                  setSuccess(result)
                  setTimeout(()=>{setSuccess(true)}, 500)
                  setShowDeleteModal(false)
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showTransactionModal && (
      <AddTransactionModal 
        onClose={() => setShowTransactionModal(false)}
        group_id={group_id}
        groupMembers={group_members}
        initialValues={{ name, amount: total_amount, description, date, transaction_id, balances }}
        isEdit={true} transaction_id={transaction_id} initializeGroupDetails={initializeGroupDetails}
    />)}
    </div>
  );
}

export default TransactionSelf;
