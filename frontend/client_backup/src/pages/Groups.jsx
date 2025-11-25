import React, { useEffect, useState, useMemo, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api';
import { AuthContext } from '../AuthContext';

const initialGroupForm = { name: '', description: '' };

// Extract GroupCard to a separate component outside of Groups
const GroupCard = React.memo(({ 
  group, 
  isActive, 
  user,
  inviteSending,
  suggestions,
  showDropdown,
  onToggleActive,
  onInviteInputChange,
  onInviteSubmit,
  onSelectEmail,
  onRemoveMember,
  removingMemberState
}) => {
  const ownerId = group.createdBy?._id || group.createdBy;
  const isOwner = user && ownerId && (ownerId === user.id || ownerId === user._id);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const cardRef = useRef(null);
  
  // Use local state for input to prevent re-renders
  const [localInputValue, setLocalInputValue] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Memoize suggestions to keep reference stable
  const memoizedSuggestions = useMemo(() => suggestions, [suggestions]);
  
  // Determine if dropdown should show (has suggestions and input has at least 2 chars)
  const shouldShowDropdown = showDropdown && memoizedSuggestions.length > 0 && localInputValue.trim().length >= 2;
  
  // Update dropdown position when it should show
  useEffect(() => {
    if (shouldShowDropdown && inputRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      
      setDropdownPosition({
        top: inputRect.bottom,
        left: inputRect.left,
        width: inputRect.width
      });
    }
  }, [shouldShowDropdown, localInputValue]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && 
          inputRef.current && !inputRef.current.contains(e.target)) {
        onSelectEmail(group._id, localInputValue);
      }
    };
    
    if (shouldShowDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [shouldShowDropdown, group._id, localInputValue, onSelectEmail]);

  const handleInputChange = useCallback((value) => {
    setLocalInputValue(value);
    onInviteInputChange(group._id, value);
  }, [group._id, onInviteInputChange]);

  const handleEmailSelect = useCallback((email) => {
    setLocalInputValue(email);
    onSelectEmail(group._id, email);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [group._id, onSelectEmail]);

  const handleInviteSubmitLocal = useCallback(() => {
    if (localInputValue.trim()) {
      onInviteSubmit(group._id, localInputValue.trim());
      setLocalInputValue('');
    }
  }, [group._id, localInputValue, onInviteSubmit]);

  return (
    <>
      <div ref={cardRef} className="relative">
        <motion.div
          className={`rounded-2xl border transition-all p-4 bg-white/80 dark:bg-gray-900/50 backdrop-blur shadow-sm ${
            isActive ? 'border-purple-500/60' : 'border-white/10'
          }`}
        >
          <button
            className="w-full text-left"
            onClick={() => onToggleActive(group._id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2">{group.description || 'No description yet.'}</p>
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-300 font-medium">
                {group.members?.length || 0} members
              </div>
            </div>
          </button>

          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 border-t border-gray-200/40 dark:border-gray-700/40 pt-4 space-y-4"
            >
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Members</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {group.members?.map((member) => {
                    const memberId = member._id || member.id;
                    const isSelf = user && (memberId === user.id || memberId === user._id);
                    const canRemove = isSelf || isOwner;
                    const isRemoving = removingMemberState[`${group._id}:${memberId}`] || false;
                    return (
                      <div key={memberId} className="flex items-center justify-between gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="font-medium">
                            {member.name}
                            {ownerId === memberId && <span className="ml-2 text-xs text-purple-400">(Owner)</span>}
                          </span>
                          <span className="text-gray-500 text-xs">{member.email}</span>
                        </div>
                        {canRemove && (
                          <button
                            onClick={() => onRemoveMember(group._id, memberId)}
                            disabled={isRemoving}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg border border-red-400/40 hover:border-red-300 transition disabled:opacity-50"
                          >
                            {isRemoving
                              ? (isSelf ? 'Leaving…' : 'Removing…')
                              : (isSelf ? 'Leave' : 'Remove')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {!group.members?.length && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No members yet.</p>
                  )}
                </div>
              </div>

              <div className="relative">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Invite Someone</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Type email or name to search..."
                      value={localInputValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <button
                    onClick={handleInviteSubmitLocal}
                    disabled={inviteSending || !localInputValue?.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-semibold shadow hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {inviteSending ? 'Sending…' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Dropdown rendered outside the card container */}
      {shouldShowDropdown && (
        <div
          ref={suggestionsRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-h-60 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          {memoizedSuggestions.map((suggestion) => (
            <button
              key={suggestion._id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => handleEmailSelect(suggestion.email)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer"
            >
              {suggestion.avatarUrl ? (
                <img
                  src={suggestion.avatarUrl}
                  alt={suggestion.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                  {suggestion.name?.charAt(0) || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {suggestion.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {suggestion.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
});

GroupCard.displayName = 'GroupCard';

export default function Groups() {
  const { user, updateUser } = useContext(AuthContext); // Added updateUser
  const { groupId: routeGroupId } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupForm, setGroupForm] = useState(initialGroupForm);
  const [creating, setCreating] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [inviteSending, setInviteSending] = useState({});
  const [respondingInvite, setRespondingInvite] = useState({});
  const [removingMember, setRemovingMember] = useState({});
  const [emailSuggestions, setEmailSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const searchTimeoutRef = useRef({});

  const activeGroup = useMemo(() => groups.find((g) => g._id === activeGroupId) || null, [groups, activeGroupId]);

  // Add this function to refresh user with groups
  const refreshUserWithGroups = async () => {
    try {
      const userRes = await API.get('/auth/me-with-groups');
      updateUser(userRes.data);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const fetchGroups = async () => {
    const res = await API.get('/groups');
    setGroups(res.data || []);
  };

  const fetchInvites = async () => {
    const res = await API.get('/groups/invites');
    setInvites(res.data || []);
  };

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchGroups(), fetchInvites()]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to load group data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      setError('Group name is required');
      return;
    }

    setCreating(true);
    setError('');
    try {
      await API.post('/groups', {
        name: groupForm.name.trim(),
        description: groupForm.description.trim()
      });
      setGroupForm(initialGroupForm);
      await fetchGroups();
      await refreshUserWithGroups(); // Refresh user data after creating group
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  const searchUsers = useCallback(async (query, groupId) => {
    if (!query || query.trim().length < 2) {
      setEmailSuggestions((prev) => ({ ...prev, [groupId]: [] }));
      setShowSuggestions((prev) => ({ ...prev, [groupId]: false }));
      return;
    }

    try {
      const res = await API.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
      const users = res.data || [];
      setEmailSuggestions((prev) => ({ ...prev, [groupId]: users }));
      setShowSuggestions((prev) => ({ ...prev, [groupId]: users.length > 0 }));
    } catch (err) {
      console.error('Search error:', err);
      setEmailSuggestions((prev) => ({ ...prev, [groupId]: [] }));
      setShowSuggestions((prev) => ({ ...prev, [groupId]: false }));
    }
  }, []);

  const handleInviteInputChange = useCallback((groupId, value) => {
    // Clear previous timeout
    if (searchTimeoutRef.current[groupId]) {
      clearTimeout(searchTimeoutRef.current[groupId]);
    }
    
    // Debounce search
    searchTimeoutRef.current[groupId] = setTimeout(() => {
      searchUsers(value, groupId);
    }, 300);
  }, [searchUsers]);

  const handleInviteSubmit = useCallback(async (groupId, email) => {
    if (!email || !email.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    
    setInviteSending((prev) => ({ ...prev, [groupId]: true }));
    setError('');
    setShowSuggestions((prev) => ({ ...prev, [groupId]: false }));
    try {
      await API.post(`/groups/${groupId}/invite`, { email: email.trim() });
      setEmailSuggestions((prev) => ({ ...prev, [groupId]: [] }));
      await fetchGroups();
      await fetchInvites();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite.');
    } finally {
      setInviteSending((prev) => ({ ...prev, [groupId]: false }));
    }
  }, []);

  const selectEmail = useCallback((groupId, email) => {
    setShowSuggestions((prev) => ({ ...prev, [groupId]: false }));
    setEmailSuggestions((prev) => ({ ...prev, [groupId]: [] }));
  }, []);

  const handleInviteResponse = async (inviteId, action) => {
    setRespondingInvite((prev) => ({ ...prev, [inviteId]: action }));
    setError('');
    try {
      await API.post(`/groups/invites/${inviteId}/respond`, { action });
      await Promise.all([fetchGroups(), fetchInvites()]);
      if (action === 'accept') {
        await refreshUserWithGroups(); // Refresh user data after accepting invite
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update invite.');
    } finally {
      setRespondingInvite((prev) => {
        const copy = { ...prev };
        delete copy[inviteId];
        return copy;
      });
    }
  };

  const handleRemoveMember = useCallback(async (groupId, memberId) => {
    setRemovingMember((prev) => ({ ...prev, [`${groupId}:${memberId}`]: true }));
    setError('');
    try {
      await API.delete(`/groups/${groupId}/members/${memberId}`);
      await fetchGroups();
      // If user is removing themselves, refresh their user data
      if (memberId === user?.id || memberId === user?._id) {
        await refreshUserWithGroups(); // Refresh user data after leaving group
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update membership.');
    } finally {
      setRemovingMember((prev) => {
        const copy = { ...prev };
        delete copy[`${groupId}:${memberId}`];
        return copy;
      });
    }
  }, [user]); // Added user dependency

  const handleToggleActive = useCallback((groupId) => {
    setActiveGroupId(prev => {
      const next = prev === groupId ? null : groupId;
      // update URL to reflect active group
      try {
        if (next) navigate(`/groups/${next}`, { replace: false });
        else navigate('/groups', { replace: false });
      } catch (e) {}
      return next;
    });
  }, []);

  // If route param changes, set active group accordingly
  useEffect(() => {
    if (routeGroupId) setActiveGroupId(routeGroupId);
  }, [routeGroupId]);

  // Memoize the groups rendering to prevent unnecessary re-renders
  const groupsList = useMemo(() => {
    return groups.map((group) => {
      const groupSuggestions = emailSuggestions[group._id] || [];
      const groupShowDropdown = showSuggestions[group._id] && groupSuggestions.length > 0;
      
      return (
        <GroupCard 
          key={group._id} 
          group={group}
          isActive={group._id === activeGroupId}
          user={user}
          inviteSending={inviteSending[group._id] || false}
          suggestions={groupSuggestions}
          showDropdown={groupShowDropdown}
          onToggleActive={handleToggleActive}
          onInviteInputChange={handleInviteInputChange}
          onInviteSubmit={handleInviteSubmit}
          onSelectEmail={selectEmail}
          onRemoveMember={handleRemoveMember}
          removingMemberState={removingMember}
        />
      );
    });
  }, [groups, activeGroupId, user, inviteSending, emailSuggestions, showSuggestions, handleToggleActive, handleInviteInputChange, handleInviteSubmit, selectEmail, handleRemoveMember, removingMember]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-950 via-slate-950 to-gray-950 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Groups
          </h1>
          <p className="text-gray-300 text-lg">
            Create groups, invite members, and manage private sharing spaces.
          </p>
        </div>

        {(loading || error) && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            {loading ? (
              <p className="text-gray-300 text-sm">Loading group info…</p>
            ) : (
              <p className="text-red-300 text-sm">{error}</p>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create a Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="text-sm text-gray-300 block mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
                  placeholder="Design Team"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={groupForm.description}
                  onChange={(e) =>
                    setGroupForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/70 resize-none"
                  placeholder="What is this group about?"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold shadow-lg hover:shadow-2xl transition disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create Group'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Groups</h2>
                <button
                  onClick={loadAll}
                  className="text-sm text-gray-300 hover:text-white transition"
                >
                  Refresh
                </button>
              </div>
              {groups.length === 0 ? (
                <p className="text-sm text-gray-400">You have not joined any groups yet.</p>
              ) : (
                <div className="space-y-4">
                  {groupsList}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold mb-4">Pending Invites</h2>
              {invites.length === 0 ? (
                <p className="text-sm text-gray-400">No pending invitations.</p>
              ) : (
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div
                      key={invite._id}
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {invite.group?.name || 'Unnamed Group'}
                        </h3>
                        <p className="text-sm text-gray-300">
                          Invited by {invite.inviter?.name || invite.inviter?.email || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleInviteResponse(invite._id, 'accept')}
                          disabled={!!respondingInvite[invite._id]}
                          className="px-4 py-2 rounded-xl bg-green-500/80 text-white text-sm font-semibold hover:bg-green-500 transition disabled:opacity-60"
                        >
                          {respondingInvite[invite._id] === 'accept' ? 'Joining…' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleInviteResponse(invite._id, 'decline')}
                          disabled={!!respondingInvite[invite._id]}
                          className="px-4 py-2 rounded-xl border border-white/20 text-sm font-semibold hover:bg-white/10 transition disabled:opacity-60"
                        >
                          {respondingInvite[invite._id] === 'decline' ? 'Declining…' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}