import {Users } from "lucide-react";
import { useNavigate} from 'react-router'
function Group ({title, memberCount, balance, lastActivity, group_id}) {
    const navigate = useNavigate();
    
    return(
        <div>
            <div className="h-full w-full border border-black/20 rounded-lg p-4 hover:shadow-sm transition bg-white hover:bg-black/2 duration-300">        
                <h1 className="text-2xl font-bold">{title}</h1>
                <div className="flex flex-row items-center justify-start text-black/65">
                    <Users className="h-4 w-4 mr-1" /> <div>{memberCount} members</div>
                </div>
                <div className="flex flex-row justify-between mt-4">
                    <p>{balance>=0 ? "You Owe:" : 'You Are Owed:'}</p>
                    <p className={`${
                        balance === 0 ? "text-black/70" : balance < 0 ? "text-green-500" : "text-red-500"
                    }`}>
                        ${Math.abs(balance.toFixed(2))}
                    </p>
                </div>

                <div>
                    <p className="text-black/70">Last activity: <span>{lastActivity}</span></p>
                </div>
                <button className="w-full mt-3 font-medium hover:bg-black/5 rounded-lg px-3 py-2" onClick={()=>navigate(`/dashboard/${group_id}`)}>View Details</button>
            </div>
        </div>
    )
}

export default Group;