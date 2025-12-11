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

const fetchUserByUsername = async (username: string): Promise<DrupalUser> => {
  const url = `https://www.drupal.org/api-d7/user.json?name=${encodeURIComponent(username)}`;
  const { data } = await fetchFromDrupal<DrupalUser>(url);
  
  if (!data.list || data.list.length === 0) {
    throw new Error('User not found');
  }
  
  return data.list[0];
};

const fetchAllUserIssues = async (userId: string, startTimestamp: number | null = null): Promise<DrupalIssue[]> => {
  let allIssues: DrupalIssue[] = [];
  let currentUrl: string | null = `https://www.drupal.org/api-d7/node.json?type=project_issue&author=${userId}&sort=created&direction=DESC`;
  
  while (currentUrl) {
    const { data, nextUrl }: FetchResult<DrupalIssue> = await fetchFromDrupal<DrupalIssue>(currentUrl);
    const issues = data.list || [];
    
    if (issues.length > 0) {
      const filteredIssues = startTimestamp 
        ? issues.filter(issue => issue.created >= startTimestamp)
        : issues;
      
      allIssues = [...allIssues, ...filteredIssues];
      
      if (startTimestamp && filteredIssues.length === 0) {
        break;
      }
      
      currentUrl = nextUrl;
    } else {
      break;
    }
  }

  return allIssues;
};

const fetchIssuesWithUserComments = async (userId: string, year = 2025): Promise<DrupalIssue[]> => {
  const startDate = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
  const endDate = Math.floor(new Date(`${year}-12-31T23:59:59`).getTime() / 1000);
  
  const issuesMap = new Map<string, DrupalIssue>();
  let currentUrl: string | null = `https://www.drupal.org/api-d7/comment.json?author=${userId}&sort=created&direction=DESC`;

  while (currentUrl) {
    const { data, nextUrl }: FetchResult<DrupalComment> = await fetchFromDrupal<DrupalComment>(currentUrl);
    const comments = data.list || [];
    
    if (comments.length > 0) {
      const commentsInYear = comments.filter(comment => 
        comment.created >= startDate && comment.created <= endDate
      );
      
      const newIssueIds = [...new Set(commentsInYear.map(c => c.node.id))]
        .filter(id => !issuesMap.has(id));
      
      for (const issueId of newIssueIds) {
        try {
          const issueUrl = `https://www.drupal.org/api-d7/node/${issueId}.json`;
          const response = await fetch(issueUrl, {
             method: 'GET',
             headers: { 'Accept': 'application/json' },
             mode: 'cors'
          });
          const issueData = await response.json(); 
          
          if (issueData.type === 'project_issue') {
            issuesMap.set(issueData.nid, issueData as DrupalIssue);
          }
        } catch (err) {
          console.error(`Failed to fetch issue ${issueId}:`, err);
        }
      }
      
      if (commentsInYear.length === 0) {
        break;
      }
      
      currentUrl = nextUrl;
    } else {
      break;
    }
  }

  return Array.from(issuesMap.values());
};

const fetchIssuesByUsername = async (username: string, year = 2025): Promise<SearchResult> => {
  const user = await fetchUserByUsername(username);
  const startDate = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
  const issues = await fetchAllUserIssues(user.uid, startDate);
  
  return {
    user,
    issues,
    totalCount: issues.length
  };
};

const fetchIssuesWithCommentsByUsername = async (username: string, year = 2025): Promise<SearchResult> => {
  const user = await fetchUserByUsername(username);
  const issues = await fetchIssuesWithUserComments(user.uid, year);
  
  return {
    user,
    issues,
    totalCount: issues.length
  };
};

const fetchProjectName = async (id: string): Promise<string> => {
  try {
    const url = `https://www.drupal.org/api-d7/node/${id}.json`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Project fetch failed (Status: ${response.status})`);
    }
    
    const data = await response.json();
    return data.title || 'Unknown Project';
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    return 'Unknown Project';
  }
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
  const [searchType, setSearchType] = useState<string>('authored');
  const [topProject, setTopProject] = useState<{ name: string; count: number } | null>(null);

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
      } else {
        result = await fetchIssuesWithCommentsByUsername(username, 2025);
      }
      
      setIssues(result.issues);
      setTotalCount(result.totalCount);

      if (result.issues.length > 0) {
        const projectCounts = result.issues.reduce((acc, issue) => {
          if (issue.field_project?.id) {
            const projectId = issue.field_project.id;
            acc[projectId] = (acc[projectId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        
        const topProjectEntry = Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0];
        
        if (topProjectEntry) {
          const [id, count] = topProjectEntry;
          const name = await fetchProjectName(id);
          setTopProject({ name, count });
        } else {
          setTopProject(null);
        }
      } else {
        setTopProject(null);
      }

      if (result.totalCount === 0) {
        const message = searchType === 'authored'
          ? `No issues found for user "${username}" in 2025. They may not have created any issues this year yet.`
          : `No issues found where user "${username}" commented in 2025. They may not have commented on any issues this year yet.`;
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
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Contributions</h3>
              <p className="text-gray-700">
                Found <span className="font-bold text-blue-600 text-3xl">{totalCount}</span> issue{totalCount !== 1 ? 's' : ''} {
                  searchType === 'authored' ? 'authored' : 'commented on'
                } by{' '}
                <span className="font-bold">{username}</span> in 2025
              </p>
            </div>
            
            {topProject && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Top Project 2025</h3>
                <div className="flex items-end gap-2">
                    <span className="font-bold text-green-600 text-3xl">{topProject.name}</span>
                    <span className="text-gray-500 mb-1">({topProject.count} contributions)</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  The project you contributed to the most this year.
                </p>
              </div>
            )}
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
