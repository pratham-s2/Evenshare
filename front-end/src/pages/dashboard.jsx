import Group from "../components/group";
import { useEffect, useState, useRef } from 'react';
import { Copy, Search } from "lucide-react";

function Dashboard () {

    const joinStates = {
        neutral: "neutral",
        error: "error",
        success: "success"
    }

    const [searchQuery, setSearchQuery] = useState("");
    const [dashboardData, setDashboardData] = useState([]);
    const [filteredDashboardData, setFilteredDashboardData] = useState([]);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
    const groupName = useRef("");
    const joinGroupCode = useRef("");
    const [createGroupCode, setCreateGroupCode] = useState("");
    const [groupCreated, setGroupCreated] = useState(false);
    const [copied, setCopied] = useState(false);
    const [joined, setJoined] = useState(joinStates.neutral);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // 3 columns × 3 rows

    let debounceTimer = useRef(null);

    async function initializeDashboard() {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard`, {
            method: "GET",
            headers: {"Content-Type": "application/json"},
            credentials: "include"
        });
        const responseData = await response.json();
        setDashboardData(responseData.results);
        setFilteredDashboardData(responseData.results);
        setCurrentPage(1); // Reset to first page
    }

    useEffect(() => { initializeDashboard() }, []);

    async function handleCreateGroup() {
        if (groupName.current.trim() !== "") {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/groups/create`, {
                method: "POST",
                credentials: "include",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({groupName: groupName.current})
            });

            const responseData = await response.json();

            if (responseData.status === "Success") {
                setCreateGroupCode(responseData.groupCode);
                setGroupCreated(true);
                initializeDashboard();
            } else {
                console.log("Invalid Group Name");
            }
        }
    }

    function handleSearchQueryChange(queryValue) {
        setSearchQuery(queryValue.slice(0, 100));

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => {
            if (queryValue.trim() === "") {
                setFilteredDashboardData(dashboardData);
            } else {
                const lowerQuery = queryValue.toLowerCase();
                const filtered = dashboardData.filter(group =>
                    group.group_name.toLowerCase().includes(lowerQuery)
                );
                setFilteredDashboardData(filtered);
            }
            setCurrentPage(1); // Reset to first page on search
        }, 300); // 300ms debounce
    }

    async function handleJoinGroup() {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/groups/join`, {
            method:"POST",
            credentials: "include",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({groupCode: joinGroupCode.current})
        });

        const responseData = await response.json();

        if (responseData.status === "success") {
            setJoined(joinStates.success);
            setTimeout(() => {
                setJoined(joinStates.neutral);
                initializeDashboard();
                setShowJoinGroupModal(false);
            }, 500);
        } else {
            setJoined(joinStates.error);
            setTimeout(() => setJoined(joinStates.neutral), 2000);
        }
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(createGroupCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems =  filteredDashboardData && filteredDashboardData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = filteredDashboardData && Math.ceil(filteredDashboardData.length / itemsPerPage);

    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
    const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

    return (
        <div className="px-12 pt-12">
            <div className="flex flex-row items-end justify-between">
                <div className="w-full">
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <div className="relative mt-3 w-2/5">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search for a group..."
                            value={searchQuery}
                            className="border border-black rounded-lg py-2 pl-10 pr-4 w-full"
                            onChange={(e) => handleSearchQueryChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-row gap-3">
                    <button
                        className="rounded-lg bg-white hover:bg-blue-100 border border-blue-600 text-blue-600 px-4 py-2 font-medium text-md whitespace-nowrap"
                        onClick={() => { setShowJoinGroupModal(true); joinGroupCode.current = ""; }}
                    >
                        Join Group
                    </button>
                    <button
                        className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium text-md whitespace-nowrap"
                        onClick={() => { setShowCreateGroupModal(true); setCreateGroupCode(""); setGroupCreated(false); groupName.current = ""; }}
                    >
                        + Create Group
                    </button>
                </div>
            </div>

            <div className={ currentItems && currentItems.length !== 0 ? "grid grid-cols-3 gap-2 py-10" : ""}>
                {currentItems && currentItems.length > 0 ? currentItems.map(group => (
                    <Group
                        key={group.group_id}
                        title={group.group_name}
                        lastActivity={group.last_activity && group.last_activity.slice(0,10) || "No activity yet"}
                        balance={group.user_balance}
                        memberCount={group.member_count}
                        group_id={group.group_id}
                    />
                )) : (
                    <h1 className="text-black opacity-70 text-md text-center mt-30">
                        You are not a part of any groups yet. Get started by creating a group or joining one of your friends!
                    </h1>
                )}
            </div>

            {/* Pagination Buttons */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-4 mt-4 mb-6">
                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-3 py-1 border rounded hover:bg-gray-100">
                        Prev
                    </button>
                    <span>{currentPage} / {totalPages}</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 border rounded hover:bg-gray-100">
                        Next
                    </button>
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateGroupModal && (
                <div className="fixed inset-0 bg-[#00000099] flex items-center justify-center z-50" onClick={() => setShowCreateGroupModal(false)}>
                    <div className="bg-white rounded-xl shadow-md p-6 w-100 flex flex-col gap-4 relative" onClick={(e) => e.stopPropagation()}>
                        {!groupCreated ? (
                            <>
                                <h2 className="text-lg font-bold text-center">Create a Group</h2>
                                <input type="text" placeholder="Enter group name" onChange={(e) => groupName.current = e.target.value} className="border rounded-lg px-3 py-2 w-full" />
                                <div className="flex gap-2">
                                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg w-full" onClick={handleCreateGroup}>Create</button>
                                    <button className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg w-full" onClick={() => setShowCreateGroupModal(false)}>Cancel</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-lg font-bold text-center">Group Created!</h2>
                                <p className="text-center">Share this code with your friends:</p>
                                <div className="flex items-center justify-center gap-2 border rounded-lg px-3 py-2">
                                    <span className="font-mono">{createGroupCode}</span>
                                    <button onClick={handleCopy} className="text-blue-600 hover:text-blue-800" title="Copy to clipboard"><Copy size={18} /></button>
                                </div>
                                {copied && <p className="text-green-600 text-sm text-center">Copied!</p>}
                                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg mt-2" onClick={() => setShowCreateGroupModal(false)}>Close</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Join Group Modal */}
            {showJoinGroupModal && (
                <div className="fixed inset-0 bg-[#00000099] flex items-center justify-center z-50" onClick={() => setShowJoinGroupModal(false)}>
                    <div className="bg-white rounded-xl shadow-md p-6 w-96 flex flex-col gap-4 relative" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-center">Join a Group</h2>
                        <input type="text" placeholder="Enter group code" onChange={(e) => joinGroupCode.current = e.target.value} className="border rounded-lg px-3 py-2 w-full" />
                        <div className="flex gap-2">
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg w-full" onClick={handleJoinGroup}>Join</button>
                            <button className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg w-full" onClick={() => setShowJoinGroupModal(false)}>Cancel</button>
                        </div>
                        {joined === "success" && (<p className="text-green-400 text-center">Joined group.</p>)}
                        {joined === "error" && (<p className="text-red-400 text-center">Couldn't join group.</p>)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
