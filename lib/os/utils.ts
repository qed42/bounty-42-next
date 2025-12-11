// ============================================
// TYPES
// ============================================

export interface DrupalUser {
  uid: string;
  name: string;
  url?: string;
}

export interface DrupalIssue {
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

export interface DrupalComment {
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

export interface DrupalApiResponse {
  user: DrupalUser;
  issues: DrupalIssue[];
  totalCount: number;
  topProject: {
    name: string;
    count: number;
  } | null;
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

const calculateTopProject = async (issues: DrupalIssue[]): Promise<{ name: string; count: number } | null> => {
  if (issues.length === 0) {
    return null;
  }

  const projectCounts = issues.reduce((acc, issue) => {
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
    return { name, count };
  }
  
  return null;
};

// ============================================
// MAIN API FUNCTIONS
// ============================================

export const fetchIssuesByUsername = async (
  username: string, 
  year = 2025
): Promise<DrupalApiResponse> => {
  const user = await fetchUserByUsername(username);
  const startDate = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
  const issues = await fetchAllUserIssues(user.uid, startDate);
  const topProject = await calculateTopProject(issues);
  
  return {
    user,
    issues,
    totalCount: issues.length,
    topProject
  };
};

export const fetchIssuesWithCommentsByUsername = async (
  username: string, 
  year = 2025
): Promise<DrupalApiResponse> => {
  const user = await fetchUserByUsername(username);
  const issues = await fetchIssuesWithUserComments(user.uid, year);
  const topProject = await calculateTopProject(issues);
  
  return {
    user,
    issues,
    totalCount: issues.length,
    topProject
  };
};
