'use client';

import React, { useState } from 'react';
import { Search, Loader2, ExternalLink, Calendar, Tag, User, AlertCircle } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface DrupalUser {
  uid: string;
  name: string;
  url?: string;
  // Add other fields if necessary
}

interface DrupalIssue {
  nid: string;
  title: string;
  type: string;
  created: number;
  changed: number;
  url: string;
  comment_count: number;
  field_issue_status: number;
  field_issue_priority: number;
  field_issue_category: number;
  field_project?: {
    id: string;
    machine_name?: string;
  };
}

interface DrupalComment {
  cid: string;
  created: number;
  node: {
    id: string;
  };
}

interface DrupalConnectData<T> {
  list?: T[];
  next?: string;
}

interface FetchResult<T> {
  data: DrupalConnectData<T>;
  nextUrl: string | null;
}

interface SearchResult {
  user: DrupalUser;
  issues: DrupalIssue[];
  totalCount: number;
}

// ============================================
// REUSABLE API UTILITIES
// ============================================

/**
 * Makes a CORS-enabled fetch request to Drupal.org API
 * Returns both the data and the next page URL if available
 */
const fetchFromDrupal = async <T,>(url: string): Promise<FetchResult<T>> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    mode: 'cors'
  });
  
  if (!response.ok) {
    throw new Error(`API request failed (Status: ${response.status})`);
  }
  
  const data: DrupalConnectData<T> = await response.json();
  return {
    data,
    nextUrl: data.next || null
  };
};

/**
 * Fetches user information by username
 * @param {string} username - Drupal.org username
 * @returns {Promise<DrupalUser>} User data including uid
 */
const fetchUserByUsername = async (username: string): Promise<DrupalUser> => {
  const url = `https://www.drupal.org/api-d7/user.json?name=${encodeURIComponent(username)}`;
  const { data } = await fetchFromDrupal<DrupalUser>(url);
  
  if (!data.list || data.list.length === 0) {
    throw new Error('User not found');
  }
  
  return data.list[0];
};

/**
 * Fetches all issues for a user created after a specific date
 * Uses the "next" URL from API responses for pagination
 * @param {string} userId - User ID
 * @param {number} startTimestamp - Unix timestamp for filtering (optional)
 * @returns {Promise<DrupalIssue[]>} All matching issues
 */
const fetchAllUserIssues = async (userId: string, startTimestamp: number | null = null): Promise<DrupalIssue[]> => {
  let allIssues: DrupalIssue[] = [];
  let currentUrl: string | null = `https://www.drupal.org/api-d7/node.json?type=project_issue&author=${userId}&sort=created&direction=DESC`;
  
  while (currentUrl) {
    const { data, nextUrl }: FetchResult<DrupalIssue> = await fetchFromDrupal<DrupalIssue>(currentUrl);
    const issues = data.list || [];
    
    if (issues.length > 0) {
      // Filter by date if timestamp provided
      const filteredIssues = startTimestamp 
        ? issues.filter(issue => issue.created >= startTimestamp)
        : issues;
      
      allIssues = [...allIssues, ...filteredIssues];
      
      // If we have a timestamp and found no matching issues in this batch, stop
      if (startTimestamp && filteredIssues.length === 0) {
        break;
      }
      
      // Move to next page
      currentUrl = nextUrl;
    } else {
      break;
    }
  }

  return allIssues;
};

/**
 * Fetches all issues where user has commented in a specific year
 * Uses the "next" URL from API responses for pagination
 * @param {string} userId - User ID
 * @param {number} year - Year to filter comments
 * @returns {Promise<DrupalIssue[]>} Issues where user commented
 */
const fetchIssuesWithUserComments = async (userId: string, year = 2025): Promise<DrupalIssue[]> => {
  const startDate = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
  const endDate = Math.floor(new Date(`${year}-12-31T23:59:59`).getTime() / 1000);
  
  const issuesMap = new Map<string, DrupalIssue>();
  let currentUrl: string | null = `https://www.drupal.org/api-d7/comment.json?author=${userId}&sort=created&direction=DESC`;

  while (currentUrl) {
    const { data, nextUrl }: FetchResult<DrupalComment> = await fetchFromDrupal<DrupalComment>(currentUrl);
    const comments = data.list || [];
    
    if (comments.length > 0) {
      // Filter comments from the specified year
      const commentsInYear = comments.filter(comment => 
        comment.created >= startDate && comment.created <= endDate
      );
      
      // Extract unique issue IDs that we haven't fetched yet
      const newIssueIds = [...new Set(commentsInYear.map(c => c.node.id))]
        .filter(id => !issuesMap.has(id));
      
      // Fetch the actual issues
      for (const issueId of newIssueIds) {
        try {
          const issueUrl = `https://www.drupal.org/api-d7/node/${issueId}.json`;
          // We get a single object here, not a list, but fetchFromDrupal expects a list format usually or generics handling needs adjustment.
          // However, Drupal API for single node usually returns the node object directly?
          // Let's check fetchFromDrupal implementation.
          // It expects `data.next` and returns `data`.
          // If the API returns the object directly, `data.list` will be undefined.
          // Let's check how it's handled.
          // The current implementation expects `data.list` in other places, but here we need to capture single item.
          // Let's create a specific fetch for single item or cast.
          const response = await fetch(issueUrl, {
             method: 'GET',
             headers: { 'Accept': 'application/json' },
             mode: 'cors'
          });
          const issueData = await response.json(); 
          
          // Only add if it's a project issue
          if (issueData.type === 'project_issue') {
            issuesMap.set(issueData.nid, issueData as DrupalIssue);
          }
        } catch (err) {
          console.error(`Failed to fetch issue ${issueId}:`, err);
        }
      }
      
      // If no matching comments in this batch, stop
      if (commentsInYear.length === 0) {
        break;
      }
      
      // Move to next page
      currentUrl = nextUrl;
    } else {
      break;
    }
  }

  return Array.from(issuesMap.values());
};

/**
 * Fetches all issues where user has any activity (authored or commented) in a specific year
 * @param {string} userId - User ID
 * @param {number} year - Year to filter activity
 * @returns {Promise<DrupalIssue[]>} All issues where user was active
 */
const fetchIssuesWithUserActivity = async (userId: string, year = 2025): Promise<DrupalIssue[]> => {
  const startDate = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
  const endDate = Math.floor(new Date(`${year}-12-31T23:59:59`).getTime() / 1000);
  
  // Use a Map to store unique issues by their nid
  const issuesMap = new Map<string, DrupalIssue>();
  
  // 1. Fetch issues authored by user in this year
  const authoredIssues = await fetchAllUserIssues(userId, startDate);
  authoredIssues.forEach(issue => {
    issuesMap.set(issue.nid, issue);
  });
  
  // 2. Fetch issues where user commented in this year
  let currentUrl: string | null = `https://www.drupal.org/api-d7/comment.json?author=${userId}&sort=created&direction=DESC`;

  while (currentUrl) {
    const { data, nextUrl }: FetchResult<DrupalComment> = await fetchFromDrupal<DrupalComment>(currentUrl);
    const comments = data.list || [];
    
    if (comments.length > 0) {
      // Filter comments from the specified year
      const commentsInYear = comments.filter(comment => 
        comment.created >= startDate && comment.created <= endDate
      );
      
      // Extract unique issue IDs that aren't already in our map
      const newIssueIds = [...new Set(commentsInYear.map(c => c.node.id))]
        .filter(id => !issuesMap.has(id));
      
      // Fetch the actual issues
      for (const issueId of newIssueIds) {
        try {
          const issueUrl = `https://www.drupal.org/api-d7/node/${issueId}.json`;
          
          const response = await fetch(issueUrl, {
             method: 'GET',
             headers: { 'Accept': 'application/json' },
             mode: 'cors'
          });
          const issueData = await response.json();

          // Only add if it's a project issue
          if (issueData.type === 'project_issue') {
            issuesMap.set(issueData.nid, issueData as DrupalIssue);
          }
        } catch (err) {
          console.error(`Failed to fetch issue ${issueId}:`, err);
        }
      }
      
      // If no matching comments in this batch, stop
      if (commentsInYear.length === 0) {
        break;
      }
      
      // Move to next page
      currentUrl = nextUrl;
    } else {
      break;
    }
  }
  
  // Convert map to array and sort by creation date (newest first)
  return Array.from(issuesMap.values()).sort((a, b) => b.created - a.created);
};

/**
 * Main function to fetch issues for a username in a specific year
 * @param {string} username - Drupal.org username
 * @param {number} year - Year to filter issues (default: 2025)
 * @returns {Promise<SearchResult>} Object containing issues array and user info
 */
export const fetchIssuesByUsername = async (username: string, year = 2025): Promise<SearchResult> => {
  // Get user data
  const user = await fetchUserByUsername(username);
  
  // Calculate start timestamp for the year
  const startDate = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
  
  // Fetch all issues for that year
  const issues = await fetchAllUserIssues(user.uid, startDate);
  
  return {
    user,
    issues,
    totalCount: issues.length
  };
};

/**
 * Main function to fetch issues where user commented in a specific year
 * @param {string} username - Drupal.org username
 * @param {number} year - Year to filter comments (default: 2025)
 * @returns {Promise<SearchResult>} Object containing issues array and user info
 */
export const fetchIssuesWithCommentsByUsername = async (username: string, year = 2025): Promise<SearchResult> => {
  // Get user data
  const user = await fetchUserByUsername(username);
  
  // Fetch all issues where user commented in that year
  const issues = await fetchIssuesWithUserComments(user.uid, year);
  
  return {
    user,
    issues,
    totalCount: issues.length
  };
};

/**
 * Main function to fetch ALL issues where user was active (authored OR commented) in a specific year
 * @param {string} username - Drupal.org username
 * @param {number} year - Year to filter activity (default: 2025)
 * @returns {Promise<SearchResult>} Object containing all issues where user was active
 */
export const fetchAllIssuesUserWorkedOn = async (username: string, year = 2025): Promise<SearchResult> => {
  // Get user data
  const user = await fetchUserByUsername(username);
  
  // Fetch all issues where user had any activity
  const issues = await fetchIssuesWithUserActivity(user.uid, year);
  
  return {
    user,
    issues,
    totalCount: issues.length
  };
};

// ============================================
// CONSTANTS AND HELPERS
// ============================================

const statusMap: Record<number, string> = {
  1: 'Active',
  2: 'Fixed',
  3: 'Closed (duplicate)',
  4: 'Postponed',
  5: "Closed (won't fix)",
  6: 'Closed (works as designed)',
  7: 'Closed (fixed)',
  8: 'Needs review',
  13: 'Needs work',
  14: 'Reviewed & tested by the community',
  15: 'Patch (to be ported)',
  16: 'Postponed (maintainer needs more info)',
  17: 'Closed (outdated)',
  18: 'Closed (cannot reproduce)'
};

const priorityMap: Record<number, string> = {
  400: 'Critical',
  300: 'Major',
  200: 'Normal',
  100: 'Minor'
};

const categoryMap: Record<number, string> = {
  1: 'Bug report',
  2: 'Task',
  3: 'Feature request',
  4: 'Support request',
  5: 'Plan'
};

const getStatusColor = (status: number) => {
  if ([2, 7].includes(status)) return 'bg-green-100 text-green-800';
  if ([8, 14].includes(status)) return 'bg-blue-100 text-blue-800';
  if ([13].includes(status)) return 'bg-yellow-100 text-yellow-800';
  if ([3, 5, 6, 17, 18].includes(status)) return 'bg-gray-100 text-gray-800';
  return 'bg-purple-100 text-purple-800';
};

const getPriorityColor = (priority: number) => {
  if (priority === 400) return 'bg-red-100 text-red-800';
  if (priority === 300) return 'bg-orange-100 text-orange-800';
  if (priority === 200) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function DrupalIssuesApp() {
  const [username, setUsername] = useState<string>('ruturaj-chaubey');
  const [issues, setIssues] = useState<DrupalIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchType, setSearchType] = useState<string>('all'); // 'authored', 'commented', or 'all'

  const handleSearch = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');
    setIssues([]);
    setTotalCount(0);

    try {
      let result: SearchResult;
      
      if (searchType === 'authored') {
        result = await fetchIssuesByUsername(username, 2025);
      } else if (searchType === 'commented') {
        result = await fetchIssuesWithCommentsByUsername(username, 2025);
      } else {
        result = await fetchAllIssuesUserWorkedOn(username, 2025);
      }
      
      setIssues(result.issues);
      setTotalCount(result.totalCount);

      if (result.totalCount === 0) {
        let message;
        if (searchType === 'authored') {
          message = `No issues found for user "${username}" in 2025. They may not have created any issues this year yet.`;
        } else if (searchType === 'commented') {
          message = `No issues found where user "${username}" commented in 2025. They may not have commented on any issues this year yet.`;
        } else {
          message = `No activity found for user "${username}" in 2025. They may not have worked on any issues this year yet.`;
        }
        setError(message);
      }
    } catch (err: unknown) {
      console.error('Error details:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (errorMessage === 'User not found') {
        setError('User not found. Please check the username.');
      } else {
        setError(`Error: ${errorMessage}. This might be due to CORS restrictions or API rate limiting. Please try again in a moment.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Drupal.org Issues Tracker</h1>
              <p className="text-gray-600">Search for issues by username in 2025</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Type</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={searchType === 'all'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">All Issues Worked On (Authored + Commented)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="authored"
                  checked={searchType === 'authored'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Issues Authored Only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="commented"
                  checked={searchType === 'commented'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Issues Worked On (based on comments of user)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
              <input
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Drupal.org username"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This app now uses the API&apos;s pagination &quot;next&quot; URLs to fetch all data across multiple pages. 
              If you encounter CORS errors or rate limiting, please wait a moment between searches.
            </p>
          </div>
        </div>

        {totalCount > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <p className="text-gray-700">
              Found <span className="font-bold text-blue-600">{totalCount}</span> issue{totalCount !== 1 ? 's' : ''} {
                searchType === 'all' ? 'worked on' : 
                searchType === 'authored' ? 'authored' : 
                'commented on'
              } by{' '}
              <span className="font-bold">{username}</span> in 2025
            </p>
          </div>
        )}

        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.nid} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-2 group"
                  >
                    {issue.title}
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  {issue.field_project?.machine_name && (
                    <p className="text-sm text-gray-600 mt-1">
                      Project: <span className="font-medium">{issue.field_project.machine_name}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.field_issue_status)}`}>
                  {statusMap[issue.field_issue_status] || 'Unknown'}
                </span>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.field_issue_priority)}`}>
                  {priorityMap[issue.field_issue_priority] || 'Unknown'}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {categoryMap[issue.field_issue_category] || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {formatDate(issue.created)}</span>
                </div>
                
                {issue.changed && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Updated: {formatDate(issue.changed)}</span>
                  </div>
                )}

                {issue.comment_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span>{issue.comment_count} comment{issue.comment_count !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!loading && issues.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Enter a username and select a search type to find their 2025 issues</p>
          </div>
        )}
      </div>
    </div>
  );
}
