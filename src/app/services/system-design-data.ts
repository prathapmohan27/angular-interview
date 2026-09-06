// System Design Learning Data — PrepHub
// 10 systems × 10 sections each, ordered for progressive learning.

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type BlockType =
  | 'paragraph'
  | 'heading2'
  | 'heading3'
  | 'bullets'
  | 'numbered'
  | 'code'
  | 'callout'
  | 'divider'
  | 'diagram';
export type CalloutVariant = 'info' | 'tip' | 'warning' | 'important';

export interface DiagramNode {
  id: string;
  name: string;
  subtitle: string;
  type: 'client' | 'network' | 'gateway' | 'server' | 'database' | 'storage' | 'security' | 'cache';
  icon: string;
  badge?: string;
  protocol?: string;
  details?: string[];
}

export interface DiagramConnection {
  from: string;
  to: string;
  label: string;
  protocol?: string;
  type?: 'sync' | 'async' | 'bidirectional';
}

export interface ConceptDiagram {
  id: string;
  title: string;
  subtitle: string;
  nodes: DiagramNode[];
  connections?: DiagramConnection[];
  keyTakeaways?: string[];
  rawSpec?: string;
}

export interface ContentBlock {
  type: BlockType;
  text?: string;
  items?: string[];
  code?: string;
  lang?: string;
  variant?: CalloutVariant;
  diagram?: ConceptDiagram;
}

export interface SystemSection {
  id: string;
  title: string;
  icon: string;
  blocks: ContentBlock[];
}

export interface SystemDesignSystem {
  id: string;
  title: string;
  icon: string;
  color: string;
  bg: string;
  accentGlow: string;
  difficulty: Difficulty;
  tagline: string;
  tags: string[];
  estimatedTime: string;
  sections: SystemSection[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 1 — URL Shortener
// ─────────────────────────────────────────────────────────────────────────────
const urlShortener: SystemDesignSystem = {
  id: 'url-shortener',
  title: 'URL Shortener',
  icon: 'ti-link',
  color: '#6366f1',
  bg: '#eef2ff',
  accentGlow: 'rgba(99,102,241,0.15)',
  difficulty: 'Beginner',
  tagline: 'Your journey begins here — master REST APIs, hashing, databases, and basic scaling.',
  tags: ['REST API', 'Hashing', 'SQL/NoSQL', 'Caching', 'Redirects'],
  estimatedTime: '45 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A URL shortening service like bit.ly or TinyURL. Users paste a long URL and get a short alias (e.g., short.ly/xK9pQ). When anyone visits the short URL, they are redirected to the original.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Given a long URL, generate a unique short URL.',
            'When the short URL is accessed, redirect the user to the original long URL.',
            'Users should optionally be able to choose a custom alias.',
            'Short URLs should expire after a configurable TTL (default: 5 years).',
            'Users can optionally track click analytics (how many times the link was visited).',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'High availability — the redirection service must be extremely reliable (99.99% uptime).',
            'Low latency — redirection must happen in <10ms ideally.',
            'Scalability — the system should handle 100M URLs created per day and 10B redirections per day.',
            'Short URLs should be unpredictable (not sequential) to prevent enumeration attacks.',
            'The system should be durable — no URL should be lost.',
          ],
        },
        { type: 'heading2', text: 'Assumptions & Constraints' },
        {
          type: 'bullets',
          items: [
            'Short URL length: 7 characters from [a-zA-Z0-9] gives 62^7 ≈ 3.5 trillion combinations — more than enough.',
            'Read-heavy workload: reads (redirections) outnumber writes (URL creation) by ~100:1.',
            'Writes: ~100M/day = ~1,160 writes/second. Reads: ~10B/day = ~115,000 reads/second.',
            'Storage: average long URL = 200 bytes. 100M/day × 365 × 5 years = ~36.5B URLs, ~7.3 TB of URL data.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Base62 Encoding' },
        {
          type: 'paragraph',
          text: 'Base62 uses 62 characters: [a-z, A-Z, 0-9]. It is used to convert a large number (like a database auto-increment ID or a hash) into a compact alphanumeric string suitable for URLs.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `const BASE62_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function toBase62(num: number): string {
  let result = '';
  while (num > 0) {
    result = BASE62_CHARS[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result.padStart(7, 'a'); // Ensure minimum length
}

// Example: 123456789 → "8M0kX"`,
        },
        { type: 'heading2', text: 'Hashing vs. Counter-Based Generation' },
        {
          type: 'bullets',
          items: [
            'Hash-based: Apply MD5/SHA256 to the long URL, take first 7 chars of base62 output. Risk: collisions. You must handle cases where two URLs produce the same hash prefix.',
            'Counter-based: Use a global counter (auto-increment ID in DB). Convert the ID to base62. Simple but requires a single point for ID generation.',
            'Random generation: Generate a random 7-char string. Check DB for collision. Works well but requires collision checking.',
          ],
        },
        { type: 'heading2', text: 'HTTP Redirect Types' },
        {
          type: 'bullets',
          items: [
            '301 (Permanent Redirect): Browser caches the redirect permanently. Future requests go directly to the destination without hitting your server. Bad for analytics — you lose click tracking.',
            '302 (Temporary Redirect): Browser always hits your server first. Every click is tracked. Slightly higher latency but you keep full analytics control.',
            'Best practice: Use 302 if you need analytics. Use 301 only if you want to offload server traffic and do not need tracking.',
          ],
        },
        { type: 'heading2', text: 'SQL vs. NoSQL for This Use Case' },
        {
          type: 'bullets',
          items: [
            'SQL (e.g., PostgreSQL): ACID guarantees, easy uniqueness constraints, familiar JOIN support. Good for < few billion rows.',
            'NoSQL (e.g., DynamoDB, Cassandra): Better horizontal scalability, fast key-value lookups, eventual consistency is acceptable for redirects. Short URL → Long URL is a pure key-value lookup — NoSQL is a natural fit.',
            'For this system at scale, a NoSQL or wide-column store (Cassandra) is preferable for the redirect store. Keep analytics in a separate data store.',
          ],
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Components Overview' },
        {
          type: 'bullets',
          items: [
            'Client: Browser or API consumer creating/following short URLs.',
            'Load Balancer: Distributes traffic across multiple API servers.',
            'API Servers (Write Service): Handles URL creation — validation, uniqueness check, ID generation, DB write.',
            'API Servers (Read/Redirect Service): Accepts short URL, looks up original, sends HTTP redirect.',
            'Cache (Redis): Stores hot short-URL-to-long-URL mappings. Most redirects hit cache, not the database.',
            'Primary Database: Stores the canonical URL mapping table.',
            'Analytics Store: Asynchronously receives click events from the redirect service.',
            'ID Generator Service (optional): Provides unique IDs using techniques like Snowflake or Zookeeper-based counters.',
          ],
        },
        { type: 'heading2', text: 'Data Flow — URL Creation' },
        {
          type: 'numbered',
          items: [
            'User sends POST /api/shorten with {longUrl, customAlias?, ttl?}',
            'API Server validates the URL (format, length, blocklist check).',
            'If custom alias: check if already taken. If yes, return error.',
            'Generate a unique short code (via ID generator or hash).',
            'Store mapping: {shortCode → longUrl, createdAt, expiry, userId} in the database.',
            'Return the short URL to the user.',
          ],
        },
        { type: 'heading2', text: 'Data Flow — Redirection' },
        {
          type: 'numbered',
          items: [
            'User visits short.ly/xK9pQ',
            'Redirect Service checks Redis cache for key "xK9pQ".',
            'Cache HIT: Return HTTP 302 redirect to long URL immediately.',
            'Cache MISS: Query database for the mapping. Cache the result with TTL. Return HTTP 302 redirect.',
            'Asynchronously fire a click event to the Analytics Service.',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'API Design' },
        {
          type: 'code',
          lang: 'text',
          code: `POST /api/v1/shorten
Body: { "longUrl": "https://...", "customAlias": "mylink", "ttlDays": 365 }
Response 201: { "shortUrl": "https://short.ly/xK9pQ", "expiresAt": "2027-09-06" }
Response 400: { "error": "Invalid URL" }
Response 409: { "error": "Alias already taken" }

GET /{shortCode}               → HTTP 302 redirect to long URL
GET /api/v1/stats/{shortCode}  → { "clicks": 4821, "countries": {...} }
DELETE /api/v1/urls/{shortCode} → HTTP 204 (auth required)`,
        },
        { type: 'heading2', text: 'Database Schema' },
        {
          type: 'code',
          lang: 'sql',
          code: `-- SQL approach
CREATE TABLE urls (
  short_code   VARCHAR(10)  PRIMARY KEY,
  long_url     TEXT         NOT NULL,
  user_id      UUID,
  created_at   TIMESTAMP    DEFAULT NOW(),
  expires_at   TIMESTAMP,
  click_count  BIGINT       DEFAULT 0
);

CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_expires_at ON urls(expires_at);`,
        },
        { type: 'heading2', text: 'ID Generation — Snowflake-inspired' },
        {
          type: 'paragraph',
          text: 'A distributed ID generator creates globally unique IDs without a central database lock. The ID is composed of: 41 bits timestamp + 10 bits machine ID + 12 bits sequence number. This guarantees uniqueness across distributed servers and is time-sortable.',
        },
        { type: 'heading2', text: 'Cache Design' },
        {
          type: 'bullets',
          items: [
            'Use Redis with the Least Recently Used (LRU) eviction policy.',
            'Key: shortCode → Value: {longUrl, expiresAt}',
            'Set TTL on cache entries to match URL expiry.',
            'Cache size: ~20% of URLs account for 80% of traffic (Pareto principle). Cache the hot 20% and you serve 80% of reads from cache.',
            'Estimated cache size: 115,000 reads/sec × 20% hot = ~23,000 unique hot URLs. Each entry ~300 bytes. A few hundred MB is sufficient.',
          ],
        },
        { type: 'heading2', text: 'Handling Collision (Hash-Based Approach)' },
        {
          type: 'bullets',
          items: [
            'Append a salt or user-specific data to the URL before hashing.',
            'If the generated short code is taken, append +1 to the salt and retry.',
            'Use database unique constraint to ensure atomicity — only one writer wins.',
            'Limit retries to 5; if all fail, fall back to random generation.',
          ],
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Horizontal Scaling' },
        {
          type: 'paragraph',
          text: 'API servers are stateless — add more instances behind the load balancer as traffic grows. Use consistent hashing or round-robin in the load balancer.',
        },
        { type: 'heading2', text: 'Database Scaling' },
        {
          type: 'bullets',
          items: [
            'Read Replicas: The redirect service does heavy reads. Route all reads to read replicas. Only writes go to the primary.',
            'Sharding: Partition the URL table by short_code. Use consistent hashing to assign short codes to shards. Each shard handles a fraction of the total URL space.',
            'NoSQL Alternative: DynamoDB or Cassandra scale horizontally by design. short_code is the partition key for O(1) lookups.',
          ],
        },
        { type: 'heading2', text: 'Cache Scaling' },
        {
          type: 'bullets',
          items: [
            'Use a Redis Cluster with multiple nodes. Consistent hashing distributes keys across nodes.',
            'Implement cache warming on startup by pre-loading frequently accessed URLs.',
            'Consider a two-tier cache: local in-process cache (e.g., LRU map) on each API server + Redis cluster. Eliminates network round-trip for the hottest URLs.',
          ],
        },
        { type: 'heading2', text: 'URL Expiry Cleanup' },
        {
          type: 'bullets',
          items: [
            'Do NOT delete URLs synchronously on expiry — this is expensive.',
            'Use a background job that runs periodically (every hour) and deletes expired rows in batches.',
            'The redirect service checks expiry on cache hit/miss and returns 410 Gone if expired.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'At 100M URLs/day and 99.9% cache hit rate, you only query the database for ~115 requests/second. A single replicated PostgreSQL instance can handle this. Start simple, add complexity only when metrics demand it.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'High Availability' },
        {
          type: 'bullets',
          items: [
            'Deploy across multiple Availability Zones (AZs). If one AZ fails, the others continue serving traffic.',
            'Database: Use a primary + 2 replica setup with automatic failover. Tools: AWS RDS Multi-AZ, PostgreSQL Patroni.',
            'Redis: Use Redis Sentinel or Redis Cluster for automatic failover.',
            'Avoid Single Points of Failure (SPOF): every component must have redundancy.',
          ],
        },
        { type: 'heading2', text: 'Consistency Considerations' },
        {
          type: 'bullets',
          items: [
            'URL creation: Requires strong consistency. A short URL must be unique. Use a single primary for writes.',
            'URL redirection: Eventual consistency is acceptable. A newly created URL may not be in all read replicas instantly, but within a few seconds it will be. The user who just created the URL can be redirected via the primary or via cache warming.',
            'Analytics: Eventual consistency is fine. Click counts being slightly delayed by seconds is acceptable.',
          ],
        },
        { type: 'heading2', text: 'Fault Tolerance Patterns' },
        {
          type: 'bullets',
          items: [
            'Circuit Breaker: If the database is slow, the circuit breaker opens and the redirect service returns cached data (or a graceful error) instead of queueing requests.',
            'Retry with Exponential Backoff: For transient failures (network blip), retry with delays of 100ms, 200ms, 400ms... before giving up.',
            'Graceful Degradation: If analytics service is down, still serve redirects. Lose click data temporarily rather than breaking the core flow.',
          ],
        },
        { type: 'heading2', text: 'Data Durability' },
        {
          type: 'bullets',
          items: [
            'Database: Enable WAL (Write-Ahead Log) for point-in-time recovery.',
            'Automated daily backups with 30-day retention.',
            'Cross-region replication for disaster recovery with RPO < 1 hour.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Latency Targets' },
        {
          type: 'bullets',
          items: [
            'URL Creation (P99): < 200ms',
            'URL Redirection with cache hit (P99): < 10ms',
            'URL Redirection with cache miss (P99): < 50ms',
          ],
        },
        { type: 'heading2', text: 'Bottleneck Analysis' },
        {
          type: 'bullets',
          items: [
            'Database reads at scale: solved by caching (Redis) and read replicas.',
            'ID generation: a single counter is a bottleneck. Solution: use a distributed ID generator (Snowflake) or pre-generate ID ranges per server.',
            'Hash collision checking: at scale, frequent DB reads to check uniqueness slow down writes. Solution: use a Bloom filter in memory to quickly reject definitely-taken aliases without a DB hit.',
          ],
        },
        { type: 'heading2', text: 'Bloom Filter for Collision Detection' },
        {
          type: 'paragraph',
          text: 'A Bloom filter is a probabilistic data structure that answers "Is this short code definitely NOT taken?" with 100% accuracy, or "Probably taken" with a small false-positive rate. Load all existing short codes into the Bloom filter at startup. On new URL creation, check the filter first — if it says "not taken," skip the DB uniqueness check entirely (fast path).',
        },
        { type: 'heading2', text: 'Async Analytics' },
        {
          type: 'paragraph',
          text: 'Never process analytics synchronously in the redirect request path. This would add 10–50ms of latency. Instead, publish a click event to a message queue (Kafka or SQS) in a fire-and-forget manner. A separate Analytics Consumer service processes events in batches and updates counters in the analytics store.',
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Hash-Based vs. Counter-Based Short Code Generation' },
        {
          type: 'bullets',
          items: [
            'Hash-Based: No central dependency, easy to distribute. But: collision handling is complex; the same long URL always produces the same short code (which may or may not be desired).',
            'Counter-Based: Simple, collision-free, predictable. But: requires a central or distributed ID generator; sequential IDs are guessable (security concern — mitigate by adding a random component or keeping IDs non-sequential).',
            'Winner for most cases: Counter-based with a distributed ID generator (Snowflake). Predictable, fast, no collision handling needed.',
          ],
        },
        { type: 'heading2', text: '301 vs. 302 Redirect' },
        {
          type: 'bullets',
          items: [
            '301: Fewer server hits, lower infrastructure cost, better perceived performance for repeat visitors. But: lose analytics, cannot change the destination later (browser ignores your server).',
            '302: Full analytics control, can change destination. But: every redirect hits your server.',
            'If analytics is a core product requirement (it usually is for URL shorteners), choose 302.',
          ],
        },
        { type: 'heading2', text: 'SQL vs. NoSQL' },
        {
          type: 'bullets',
          items: [
            'SQL gives ACID guarantees and is easier to query flexibly. Great up to ~1B rows with proper indexing.',
            'NoSQL (Cassandra/DynamoDB) scales to virtually unlimited rows with consistent performance but at the cost of flexible querying and strong consistency.',
            'For a URL shortener: the primary access pattern is a simple key lookup — NoSQL is ideal for the redirect store.',
          ],
        },
        { type: 'heading2', text: 'Custom Alias — Consistency Challenge' },
        {
          type: 'paragraph',
          text: 'Allowing custom aliases means two users might try to claim the same alias simultaneously. You need a uniqueness check + insert to be atomic. In SQL, use a unique constraint and handle the constraint violation error. In NoSQL (like DynamoDB), use conditional writes ("put if not exists"). Without atomicity, two users could both "win" and overwrite each other.',
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Monitoring & Observability' },
        {
          type: 'bullets',
          items: [
            'Key metrics: redirect latency (P50, P95, P99), cache hit ratio, URL creation rate, error rate, database query time.',
            'Tools: Prometheus + Grafana for metrics, Jaeger/Zipkin for distributed tracing, ELK Stack or Datadog for logs.',
            'Alerts: Page on-call if P99 latency > 100ms, error rate > 0.1%, or cache hit ratio drops below 80%.',
          ],
        },
        { type: 'heading2', text: 'Security' },
        {
          type: 'bullets',
          items: [
            'Rate limiting on URL creation: max 100 URLs/min per IP or authenticated user. Prevents abuse/spam.',
            'URL validation: Blocklist known malware/phishing domains. Use a third-party URL reputation API (e.g., Google Safe Browsing).',
            'Authentication: Require login to create URLs (prevents anonymous spam). Use JWT for API auth.',
            'Short code unpredictability: Avoid purely sequential codes. Add randomness so codes cannot be enumerated.',
            'HTTPS only: Redirect over HTTPS. HSTS (HTTP Strict Transport Security) prevents downgrade attacks.',
          ],
        },
        { type: 'heading2', text: 'Deployment' },
        {
          type: 'bullets',
          items: [
            'Containerize services with Docker. Orchestrate with Kubernetes.',
            'Use a CDN (e.g., Cloudflare) in front of the redirect service. CDN edge nodes can handle redirects for the hottest URLs without ever reaching your origin servers.',
            'Blue-green deployments: Deploy new versions alongside old. Switch traffic over gradually. Roll back instantly if errors spike.',
          ],
        },
        { type: 'heading2', text: 'Disaster Recovery' },
        {
          type: 'bullets',
          items: [
            'RTO (Recovery Time Objective): < 1 hour. Time to restore service after failure.',
            'RPO (Recovery Point Objective): < 1 hour. Maximum data loss tolerable.',
            'Automated database backup + cross-region replication achieves these targets.',
            'Run chaos engineering exercises quarterly to validate failover procedures.',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'How would you generate a unique short code for every URL?',
            'What happens if two users create a URL simultaneously and get the same short code?',
            'How would you handle 301 vs 302 redirects and why does the choice matter?',
            'How would you scale this system to handle 10 billion redirects per day?',
            'How would you implement URL expiration?',
            'How would you track click analytics without slowing down redirects?',
          ],
        },
        { type: 'heading2', text: 'Follow-Up Questions an Interviewer Might Ask' },
        {
          type: 'bullets',
          items: [
            '"What if your Redis cache goes down?" → Graceful fallback to DB with circuit breaker.',
            '"How would you prevent the same long URL from creating thousands of duplicate short URLs?" → Store a longUrl→shortCode reverse mapping, or hash-based generation.',
            '"How would you implement a URL preview feature (instead of direct redirect)?" → Intermediate "preview" page before redirect.',
            '"What if a user wants to delete their URL?" → Soft delete with a deleted_at timestamp. Cache eviction on delete.',
          ],
        },
        { type: 'heading2', text: 'How to Explain Clearly in an Interview' },
        {
          type: 'numbered',
          items: [
            'Start with requirements clarification (5 min) — ask about scale, analytics, custom aliases.',
            'Estimate scale (2 min) — writes/reads per second, storage size.',
            'Propose the simplest possible design first (single server, one DB).',
            'Identify bottlenecks as you scale up: database reads → add cache. Write throughput → add replicas.',
            'Discuss trade-offs explicitly: "I chose 302 over 301 because analytics is a requirement."',
          ],
        },
        { type: 'heading2', text: 'Common Mistakes Candidates Make' },
        {
          type: 'bullets',
          items: [
            'Jumping to complex distributed solutions without first establishing requirements.',
            'Ignoring cache — mentioning "just query the database" for 115K reads/second shows lack of production experience.',
            'Forgetting URL expiration and cleanup.',
            'Not discussing collision handling for hash-based generation.',
            'Treating 301 and 302 as interchangeable without knowing the implications.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The URL Shortener is a gateway system design interview topic. Mastering it thoroughly — especially the cache layering, ID generation, and redirect mechanics — builds the foundation for every more complex system in this course.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 2 — Rate Limiter
// ─────────────────────────────────────────────────────────────────────────────
const rateLimiter: SystemDesignSystem = {
  id: 'rate-limiter',
  title: 'Rate Limiter',
  icon: 'ti-gauge',
  color: '#f59e0b',
  bg: '#fef3c7',
  accentGlow: 'rgba(245,158,11,0.15)',
  difficulty: 'Beginner',
  tagline:
    'Learn distributed counters, Redis atomicity, and the algorithms that protect every production API.',
  tags: ['Redis', 'Token Bucket', 'Sliding Window', 'Lua Scripts', 'Distributed'],
  estimatedTime: '40 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A rate limiter controls how many requests a client (user, IP, API key) can make to a service within a given time window. It is a critical infrastructure component that protects services from abuse, DDoS attacks, and runaway clients.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Limit requests per user/IP/API key within a time window.',
            'Return HTTP 429 Too Many Requests when limit is exceeded.',
            'Include headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.',
            'Support multiple rate limiting rules simultaneously (per-user AND per-endpoint).',
            'Allow different limits for different API tiers (free: 100/hr, paid: 10,000/hr).',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Ultra-low latency: < 1ms overhead per request (rate limit check must be near-instant).',
            'High availability: rate limiter failure should not block all traffic (fail open vs. fail closed decision).',
            'Accuracy: counts must be accurate across distributed servers.',
            'Must work across multiple instances of the API server (distributed rate limiting).',
          ],
        },
        { type: 'heading2', text: 'Why Not Just Do It in the Application?' },
        {
          type: 'paragraph',
          text: 'If you have 10 API server instances, each server only sees 1/10th of the traffic. A per-server counter allows 10x the intended limit. You need a SHARED counter store (Redis) that all servers read/write to maintain accurate global counts.',
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Algorithm 1: Token Bucket' },
        {
          type: 'paragraph',
          text: 'Imagine a bucket that holds tokens. Each request consumes one token. Tokens are added back at a fixed rate (e.g., 10 tokens/second). If the bucket is empty, the request is rejected. The bucket has a maximum capacity.',
        },
        {
          type: 'bullets',
          items: [
            'Pros: Allows short bursts (if bucket is full). Smooth average rate over time.',
            'Cons: Requires storing last_refill_time and token_count per user.',
            'Used by: AWS API Gateway, Stripe API.',
          ],
        },
        { type: 'heading2', text: 'Algorithm 2: Leaky Bucket' },
        {
          type: 'paragraph',
          text: 'Requests enter a queue (bucket) at any rate, but leave (are processed) at a fixed rate. Like a bucket with a small hole at the bottom. If the bucket overflows, new requests are dropped.',
        },
        {
          type: 'bullets',
          items: [
            'Pros: Produces a very smooth, steady output rate. No bursts.',
            'Cons: Queued requests have added latency. Does not handle sudden legitimate bursts well.',
            'Used by: Traffic shaping in networking equipment.',
          ],
        },
        { type: 'heading2', text: 'Algorithm 3: Fixed Window Counter' },
        {
          type: 'paragraph',
          text: 'Divide time into fixed windows (e.g., every minute from :00 to :60). Count requests within the current window. Reset counter at the start of each new window.',
        },
        {
          type: 'bullets',
          items: [
            'Pros: Very simple and fast. Easy to implement with Redis INCR + EXPIRE.',
            'Cons: "Edge burst" problem. If limit is 100/min, a user can make 100 requests at :59 and 100 more at :01 of the next minute — 200 requests in 2 seconds.',
          ],
        },
        { type: 'heading2', text: 'Algorithm 4: Sliding Window Log' },
        {
          type: 'paragraph',
          text: 'Store a timestamp for every request in a sorted set. When a new request arrives, count timestamps within the last [window_size] seconds. If count >= limit, reject.',
        },
        {
          type: 'bullets',
          items: [
            'Pros: Perfectly accurate — no edge burst problem.',
            'Cons: High memory usage. Storing every request timestamp for every user is expensive at scale.',
          ],
        },
        { type: 'heading2', text: 'Algorithm 5: Sliding Window Counter (Best of Both)' },
        {
          type: 'paragraph',
          text: 'Combine fixed window counters with a weighted average. Approximate the sliding window using two consecutive fixed window counts.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `estimated_count = current_window_count + 
                  previous_window_count × (1 - elapsed_fraction_of_window)

Example: Limit = 100/min
Previous window count: 80
Current window count: 20  
We are 75% through the current window
Estimated = 20 + 80 × (1 - 0.75) = 20 + 20 = 40  → Allow (40 < 100)`,
        },
        {
          type: 'bullets',
          items: [
            'Pros: Very memory efficient (only 2 counters per user). Accurate enough for most use cases.',
            'Cons: Slightly approximate (but within ~0.003% error in practice).',
            'Recommended: This is the algorithm used by Cloudflare for their global rate limiter.',
          ],
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Where Does the Rate Limiter Live?' },
        {
          type: 'bullets',
          items: [
            'Client-side: Never. Clients can bypass it trivially.',
            'API Gateway: Best for platform-wide rate limiting. The gateway intercepts every request before it reaches any service. Central enforcement, single code change.',
            'Application Middleware: Per-service rate limiting with custom rules. More flexible but requires implementation in every service.',
            'Dedicated Rate Limit Service: A separate microservice that all API servers call. High availability concern — it becomes a dependency of every service.',
          ],
        },
        { type: 'heading2', text: 'Architecture Diagram Components' },
        {
          type: 'bullets',
          items: [
            'Client → API Gateway (Rate Limit Middleware) → Backend Services',
            'API Gateway queries Redis for the current count for the client identifier.',
            'If under limit: increment counter, forward request.',
            'If over limit: return 429 immediately, do not forward.',
            'Redis Cluster: Shared counter store for all gateway instances.',
            'Rules Store: Database or config service holding rate limit rules per tier/endpoint.',
          ],
        },
        { type: 'heading2', text: 'Client Identification Strategies' },
        {
          type: 'bullets',
          items: [
            'IP Address: Simple but problematic with NAT (thousands of users sharing one IP).',
            'User ID (JWT): Most accurate for authenticated APIs. Users, not IPs, are rate limited.',
            'API Key: Useful for B2B APIs where each client gets a unique key.',
            'Combination: Rate limit by IP for unauthenticated requests, by User ID once authenticated.',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Redis Implementation — Sliding Window Counter' },
        {
          type: 'code',
          lang: 'lua',
          code: `-- Lua script for atomic sliding window counter in Redis
-- Executed atomically on a single Redis node

local key_current = KEYS[1]   -- e.g., "rate:userId:1234:2026-09-06-14-05"  (current minute)
local key_previous = KEYS[2]  -- e.g., "rate:userId:1234:2026-09-06-14-04"  (previous minute)
local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local elapsed_ms = tonumber(ARGV[3])  -- ms elapsed in current window

local current = tonumber(redis.call('GET', key_current) or '0')
local previous = tonumber(redis.call('GET', key_previous) or '0')

local fraction = 1 - (elapsed_ms / window_ms)
local estimated = current + math.floor(previous * fraction)

if estimated >= limit then
    return {0, estimated}  -- {allowed=false, current_count}
end

redis.call('INCR', key_current)
redis.call('PEXPIRE', key_current, window_ms * 2)  -- expire after 2 windows
return {1, estimated + 1}  -- {allowed=true, new_count}`,
        },
        { type: 'heading2', text: 'Why a Lua Script?' },
        {
          type: 'paragraph',
          text: 'Lua scripts in Redis execute atomically on a single node — they are not interrupted by other commands. This prevents race conditions where two requests simultaneously read the same counter, both see count = 99 (under limit of 100), both increment, resulting in count = 101 (over limit but both allowed).',
        },
        { type: 'heading2', text: 'Response Headers' },
        {
          type: 'code',
          lang: 'http',
          code: `HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 750
X-RateLimit-Reset: 1725638400  (Unix timestamp when window resets)
Retry-After: 45               (seconds until next window, only on 429)`,
        },
        { type: 'heading2', text: 'Multi-Level Rate Limiting' },
        { type: 'paragraph', text: 'Production systems enforce multiple simultaneous limits:' },
        {
          type: 'bullets',
          items: [
            'Per-user, per-minute: 100 requests/minute',
            'Per-user, per-day: 10,000 requests/day',
            'Per-endpoint, global: /api/v1/heavy-endpoint: 1,000 requests/minute across all users',
            'Per-IP (unauthenticated): 20 requests/minute',
          ],
        },
        {
          type: 'paragraph',
          text: 'Check all applicable rules in one round-trip using Redis pipelines (batch multiple GET commands in a single network call).',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Redis Cluster Sharding' },
        {
          type: 'paragraph',
          text: 'A single Redis instance can handle ~100K operations/second. For higher throughput, use Redis Cluster which shards keys across multiple nodes using consistent hashing. Rate limit keys are naturally distributed — different users hash to different Redis nodes.',
        },
        { type: 'heading2', text: 'The Race Condition Problem at Scale' },
        {
          type: 'paragraph',
          text: 'Even with Lua scripts (atomic per-node), Redis Cluster does not support multi-key Lua scripts across shards. If you need to check multiple rate limit keys (per-minute AND per-day) that might live on different Redis nodes, you have a challenge.',
        },
        {
          type: 'bullets',
          items: [
            'Solution 1: Use hash tags {userId} to force all keys for the same user onto the same shard. Key: "rate:{userId}:1m" and "rate:{userId}:1d" — the {userId} forces them to the same slot.',
            'Solution 2: Accept slight inaccuracy — check each limit independently. Approximate counts are acceptable for most use cases.',
          ],
        },
        { type: 'heading2', text: 'Local Cache for Hot Paths' },
        {
          type: 'paragraph',
          text: 'For extremely high-traffic APIs, even a Redis call (1-2ms) adds up. Add a local in-memory cache per API server instance that stores "definitely blocked" users. If a user hit their limit, locally cache this for a few seconds — skip the Redis call entirely for subsequent requests from that user.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Fail Open vs. Fail Closed' },
        {
          type: 'paragraph',
          text: 'What happens if Redis goes down? This is the most important design decision for a rate limiter.',
        },
        {
          type: 'bullets',
          items: [
            'Fail Open: If Redis is unavailable, allow all requests through. Users can exceed their limits temporarily. Safer for the user experience but dangerous during a DDoS when you most need limiting.',
            'Fail Closed: If Redis is unavailable, reject all requests with 429. Guarantees protection but may cause a complete service outage even for legitimate users.',
            'Recommended: Fail open for normal services (availability > protection). Fail closed for high-security or payment APIs (protection > availability). Always set a timeout on Redis calls (< 10ms) so a slow Redis does not block the request path.',
          ],
        },
        { type: 'heading2', text: 'Redis High Availability' },
        {
          type: 'bullets',
          items: [
            'Use Redis Sentinel: automatic failover when the primary node fails.',
            'Or use Redis Cluster: built-in sharding and replication.',
            'Deploy Redis across multiple AZs for resilience.',
            'Redis data is ephemeral (counters expire). Losing a Redis node means losing rate limit counts for that window — slightly inaccurate but not catastrophic. Unlike a URL database, Redis data is not permanent business data.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Target: < 1ms Overhead' },
        {
          type: 'paragraph',
          text: 'The rate limiter adds latency to every API request. Keep it minimal:',
        },
        {
          type: 'bullets',
          items: [
            'Use Redis pipeline to batch multiple GET/SET commands: ~0.5ms for 3 commands vs. ~1.5ms for 3 separate commands.',
            'Local memory cache for "confirmed blocked" users: 0ms (no network).',
            'Connection pooling: maintain a warm pool of Redis connections. Avoid connection setup overhead per request.',
            'Timeouts: Set a hard 5ms timeout on Redis operations. If exceeded, fail open.',
          ],
        },
        { type: 'heading2', text: 'Memory Efficiency' },
        {
          type: 'bullets',
          items: [
            'Sliding window log stores every timestamp — O(requests per user per window) memory. Problematic at scale.',
            'Sliding window counter stores only 2 integers per user per window — O(1) memory. Highly efficient.',
            'Set short TTLs on all rate limit keys (2× the window size). Expired keys are automatically removed by Redis.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Algorithm Selection Trade-offs' },
        {
          type: 'bullets',
          items: [
            'Token Bucket: Best for APIs that allow bursts (download endpoints, real-time data feeds). A user can burst 100 requests instantly if they have accumulated tokens.',
            'Fixed Window: Simplest to implement, works fine for most APIs. The edge burst problem is usually acceptable in practice.',
            'Sliding Window Counter: Best balance of accuracy and efficiency. Recommended for most production use cases.',
            'Sliding Window Log: Maximum accuracy but too memory-intensive at scale. Avoid unless you have a strong business reason for per-request accuracy.',
          ],
        },
        { type: 'heading2', text: 'Centralized vs. Distributed Rate Limiting' },
        {
          type: 'bullets',
          items: [
            'Centralized (single Redis): Simple, perfectly accurate. Bottleneck at very high scale.',
            'Distributed (each server has its own counter): Ultra-fast (no network), but inconsistent counts across servers. A user can exceed limits by up to N×limit where N is the number of servers.',
            'Hybrid: Use local counters for rough rate limiting. Sync to Redis periodically for accurate enforcement.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Monitoring Rate Limiters' },
        {
          type: 'bullets',
          items: [
            'Track 429 rate by client: A sudden spike in 429s for a specific user/API key may indicate a bug, not abuse.',
            'Track Redis hit rate and latency: If Redis is slow, your API is slow.',
            'Alert on sustained high 429 rates: Could indicate a DDoS in progress.',
          ],
        },
        { type: 'heading2', text: 'Graceful Degradation for Legitimate Users' },
        {
          type: 'bullets',
          items: [
            'Provide clear error messages with retry-after timing.',
            'Implement exponential backoff documentation for SDK users.',
            'For enterprise customers, allow burst quotas or grace periods.',
            'Consider a request queue for slightly-over-limit requests rather than instant rejection.',
          ],
        },
        { type: 'heading2', text: 'Security Considerations' },
        {
          type: 'bullets',
          items: [
            'IP spoofing: Limit by authenticated user ID, not IP, when possible.',
            'Rate limit bypassing via distributed requests: Use per-user limits, not per-IP.',
            'Never reveal internal rate limit keys or algorithms in error messages.',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'Explain the token bucket algorithm and implement it.',
            'What is the difference between fixed window and sliding window rate limiting?',
            'How would you implement a distributed rate limiter across 50 API servers?',
            'What happens to your rate limiter if Redis goes down?',
            'How would you rate limit at the level of an API endpoint, not just a user?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Always mention the distributed nature of the problem — single-server counting is incorrect.',
            'Discuss Lua scripts for Redis atomicity — shows production knowledge.',
            'Bring up fail-open vs. fail-closed as a deliberate design decision.',
            'Mention header standards (X-RateLimit-*) for good API design.',
          ],
        },
        { type: 'heading2', text: 'Common Mistakes' },
        {
          type: 'bullets',
          items: [
            'Designing a rate limiter that only works on a single server.',
            'Forgetting to discuss what happens when the rate limit store (Redis) fails.',
            'Using the sliding window log algorithm without acknowledging its memory cost.',
            'Not considering multiple simultaneous rate limit rules.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Rate limiters are often a "depth" question — the interviewer wants to see how deep you can go. Bring up Lua atomicity, Redis Cluster sharding with hash tags, and fail-open/closed decisions to demonstrate production depth.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 3 — Distributed Cache / Key-Value Store
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM: Distributed Load Balancer
// ─────────────────────────────────────────────────────────────────────────────
const distributedLoadBalancer: SystemDesignSystem = {
  id: 'load-balancer',
  title: 'Distributed Load Balancer',
  icon: 'ti-scale',
  color: '#06b6d4',
  bg: '#cffafe',
  accentGlow: 'rgba(6,182,212,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Design a high-throughput, fault-tolerant Layer 4 and Layer 7 distributed load balancing infrastructure handling 10 million concurrent connections.',
  tags: ['L4 vs L7', 'Anycast BGP', 'Consistent Hashing', 'Health Checks', 'Maglev / Envoy'],
  estimatedTime: '45 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'The Core Challenge' },
        {
          type: 'paragraph',
          text: 'A load balancer is a front door for a group of servers. The client sends traffic to one public Virtual IP (VIP); the balancer chooses a healthy backend server and forwards the traffic. At small scale this can be one reverse-proxy process. At internet scale, the front door itself must also be distributed across many machines and locations.',
        },
        { type: 'heading2', text: 'Start With a Small Example' },
        {
          type: 'numbered',
          items: [
            'A browser requests GET /products from shop.example.com.',
            'DNS returns the load balancer VIP. The browser connects to that VIP.',
            'The load balancer removes unhealthy servers from its candidate list.',
            'It chooses App Server B and forwards the request over the private network.',
            'App Server B returns the product list through the load balancer to the browser.',
            'If B fails a health check, new requests go to A or C instead. The load balancer is a traffic director, not the application that owns the product data.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Keep this distinction in mind: L4 decides using connection metadata; L7 can read HTTP details such as /products, cookies, and headers. The rest of this design explains how to scale both kinds — and how that same single request multiplies into a 10-million-connection problem.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Traffic Distribution: Distribute incoming TCP, UDP, and HTTP/HTTPS connections across a dynamic pool of backend application instances.',
            'Health Probing & Automatic Failover: Continuously monitor backend health; isolate failing nodes in < 3 seconds with zero manual intervention.',
            'Content-Based Routing: Support Layer 7 URL path, host header, and method-based routing rules.',
            'TLS Termination & Offloading: Terminate TLS at the edge to offload cryptographic CPU overhead from backend workers.',
            'Graceful Connection Draining: Drain connections gracefully during backend deployments without severing active transactions.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'High Availability: 99.999% uptime (less than 5.26 minutes of downtime per year). No single point of failure anywhere in the data path.',
            'Ultra-Low Latency: Layer 4 packet forwarding overhead < 1ms; Layer 7 proxy routing overhead < 4ms.',
            'Massive Throughput: Scalable to 10M+ concurrent TCP connections and 100+ Gbps bandwidth per cluster.',
            'Stateless Scaling: The load balancing tier itself must be horizontally scalable across standard commodity hardware without inter-node synchronization bottlenecks.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Foundational Distributed Networking Concepts' },
        {
          type: 'bullets',
          items: [
            'Anycast BGP: Multiple edge locations announce the same VIP. Internet routing usually sends a client to a nearby location, reducing distance and spreading load globally.',
            'Equal-Cost Multi-Path (ECMP): A switch hashes each connection using its 5-tuple (source/destination IP, source/destination port, and protocol) and assigns it to one L4 balancer. All packets in that connection stay on the same path.',
            'Consistent Hashing & Maglev: A deterministic lookup table maps a connection to a balancer or backend. When a node changes, only some mappings move instead of all connections being reshuffled.',
            'eBPF & XDP (eXpress Data Path): Running custom C bytecode directly inside the Linux kernel network driver to route or drop packets before memory allocation occurs, achieving very high per-server packet rates.',
            'Direct Server Return (DSR): For suitable high-volume traffic, the request passes through the balancer but the backend sends the response directly to the client. This saves bandwidth at the balancer, but removes some response inspection and control.',
          ],
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Two-Tier Load Balancing Architecture' },
        {
          type: 'paragraph',
          text: 'At large scale, split the front door into two jobs. L4 handles fast connection distribution; L7 understands HTTP and makes service-level routing decisions. This separation keeps expensive TLS and HTTP work away from the packet-forwarding path.',
        },
        {
          type: 'bullets',
          items: [
            'Tier 1 — Anycast Edge & ECMP Switches: Send a client to a nearby location, then spread each connection across the L4 fleet.',
            'Tier 2 — Stateless L4 Balancer Fleet (Maglev / Katran): Uses connection metadata to forward packets to an L7 proxy. "Stateless" means it does not need a shared per-connection database with every peer; the same hash leads packets consistently to the same destination.',
            'Tier 3 — L7 Proxy Fleet (Envoy / Nginx): Terminates TLS, reads HTTP, applies rate limits, and routes /checkout to Payments while /images goes to Assets.',
            'Tier 4 — Application Service Pool: Stateless application workers handling business logic.',
            'Health Checking & Service Discovery Daemon: Continuously inspects node health and distributes updated server lists via a lightweight gossip protocol or ZooKeeper/Consul.',
          ],
        },
      ],
    },
    {
      id: 'worked-example',
      title: 'Worked Example: Tracing 10 Million Connections',
      icon: 'ti-route',
      blocks: [
        { type: 'heading2', text: 'From One Request to Ten Million, Tier by Tier' },
        {
          type: 'paragraph',
          text: 'The requirements above describe each tier in isolation. It is easier to hold onto the design if you trace what actually happens to the full 10 million concurrent connections as they spread out across the fleet, tier by tier, with real numbers.',
        },
        {
          type: 'numbered',
          items: [
            'Global demand: 10,000,000 concurrent connections arrive from clients worldwide, all addressed to one Anycast VIP.',
            'Anycast edge split: BGP routes each client to its nearest of 60 edge PoPs based on network topology, not a central dispatcher. Assuming roughly even geographic demand, each PoP now sees about 166,000 concurrent connections — small enough for a modest local cluster to absorb.',
            "ECMP hand-off inside a PoP: The local switch hashes each connection's 5-tuple and spreads the 166,000 connections across, say, 8 L4 balancer nodes. Each L4 node now handles about 20,000 connections — using no shared state with its 7 siblings.",
            'Maglev lookup on the L4 node: For each incoming packet, the node computes hash(5-tuple) % M against its local Maglev table and gets back one of, say, 4 local L7 proxies — instantly and without asking any other machine.',
            "L7 proxy load: Each of those 4 Envoy proxies ends up holding roughly 5,000 concurrent connections. This is comfortably inside a single 16-core proxy's capacity, leaving headroom for TLS termination and HTTP parsing.",
            'Backend fan-out: The L7 proxy reads the HTTP path and sends /checkout requests to the Payments pool and /products requests to the Catalog pool — so within those 5,000 connections, only the relevant slice ever reaches any one backend service.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: "Notice that no single number in this chain is large. The system's scale comes from repeating a small, cheap decision (one hash lookup) at every tier, in parallel, across thousands of independent nodes — not from any one component being individually massive.",
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: '1. eBPF / XDP Packet Processing Engine' },
        {
          type: 'paragraph',
          text: 'Traditional Linux packet handling requires creating an sk_buff data structure in kernel memory, which limits throughput to roughly one to two million packets per second per server. By running an eBPF program at the XDP (eXpress Data Path) layer directly in the network card driver, packets are inspected and redirected in place, reaching an order of magnitude more packets per second per server.',
        },
        { type: 'heading2', text: '2. The Maglev Consistent Hashing Table' },
        {
          type: 'paragraph',
          text: 'To avoid maintaining a distributed connection state table across all L4 balancers, each L4 node independently generates an identical lookup table of size M (where M is a prime number, e.g. 65,537). Each backend server produces a pseudorandom permutation of numbers in [0, M-1]. The lookup table is filled sequentially. When a packet arrives, hash(5-tuple) % M yields the target backend without any inter-server communication — this is exactly the lookup traced in step 4 of the worked example above.',
        },
        { type: 'heading2', text: '3. Direct Server Return (DSR) Implementation' },
        {
          type: 'paragraph',
          text: 'In DSR, the load balancer rewrites the destination MAC address to the chosen backend server while keeping the destination IP set to the VIP. The backend server configures a dummy loopback interface with the VIP address. When the backend application writes the response, the Linux kernel uses the VIP as the source IP and routes packets directly out to the gateway router, bypassing the load balancer completely.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Handling 10 Million Concurrent Connections' },
        {
          type: 'bullets',
          items: [
            'Horizontally Scaling L4: Because L4 nodes use stateless Maglev hashing, adding a 10th or 20th L4 server to the ECMP switch requires zero state migration. The fleet scales linearly with hardware.',
            'Epoll & Event-Driven L7: Each Envoy proxy process uses non-blocking asynchronous epoll/kqueue event loops. A single 16-core Envoy instance can maintain around 200,000 concurrent idle keep-alive TCP connections using roughly 2 GB of RAM.',
            'Anycast Geo-Distribution: Announcing the VIP from 60 global edge PoPs splits the 10 million global connections into roughly 166,000 connections per PoP — the same split traced step by step in the worked example above.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Zero Single Points of Failure' },
        {
          type: 'bullets',
          items: [
            'L4 Node Failure: If an L4 balancer server burns out, the hardware switch detects BGP session loss in < 500ms and redirects ECMP routes to surviving L4 nodes. Maglev hashing guarantees that surviving nodes map established flows to the exact same L7 proxies.',
            'L7 Proxy Failure: If an Envoy proxy crashes, L4 health checkers detect the TCP reset and remove it from the Maglev backend list. Connections are re-established to peer Envoy nodes.',
            'Backend Server Crash: For idempotent requests (GET, HEAD), the L7 proxy detects socket closure and transparently replays the request to an alternate healthy server without returning an error to the end user.',
            'Active-Passive VRRP Failover (for smaller on-premise clusters): When Anycast/BGP is unavailable, Keepalived uses Virtual Router Redundancy Protocol (VRRP) heartbeats. A backup server claims the shared VIP via Gratuitous ARP if the master misses 3 heartbeats.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Sub-Millisecond Routing Optimizations' },
        {
          type: 'bullets',
          items: [
            'Direct Server Return (DSR): Offloads the majority of network bandwidth from the load balancer tier, preventing return-traffic network interface saturation.',
            'TLS Session Ticket Resumption: Caches TLS session tickets in a distributed Redis cluster. Returning clients resume encrypted sessions in 0-RTT without a full cryptographic handshake.',
            'HTTP/2 Multiplexing to Backends: L7 proxies maintain persistent connection pools to backend servers, multiplexing hundreds of client requests over a few long-lived TCP sockets to eliminate handshake latency.',
            'Zero-Copy Socket Transfers: Using the splice() and sendfile() Linux system calls moves data directly between socket buffers without copying bytes into userspace memory.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Critical Architectural Decisions' },
        {
          type: 'bullets',
          items: [
            'Layer 4 vs. Layer 7: L4 delivers substantially higher packet throughput and lower latency, but cannot inspect HTTP paths or cookies. L7 enables intelligent routing and SSL offloading, but requires significantly more CPU and memory per connection.',
            'Direct Server Return (DSR) vs. Full Proxy: DSR can multiply outbound throughput several times over, but prevents the load balancer from inspecting, caching, or compressing outbound HTTP responses.',
            'Hardware Appliances (F5 / NetScaler) vs. Software Balancers (Envoy / Katran): Hardware appliances offer dedicated ASIC speed, but are expensive and lack programmatic API agility. Software balancers running on commodity Linux servers scale horizontally at cloud economics.',
            'Least Connections vs. Consistent Hashing: Least Connections balances server CPU load evenly. Consistent Hashing routes the same user to the same node (maximizing cache hit ratios), but risks hotspots if a few users generate massive traffic.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Operational Resilience & Observability' },
        {
          type: 'bullets',
          items: [
            'SYN Cookies (DDoS Protection): When receiving thousands of malicious incomplete TCP handshakes (SYN flood), the load balancer encodes connection state into the TCP sequence number, allocating zero RAM until the client sends the final ACK.',
            'Connection Draining: When a server is deregistered for upgrade, it enters DRAINING state for 300 seconds. Existing user requests finish cleanly while all new requests go to updated nodes.',
            'Canary & Traffic Splitting: L7 proxies route 95% of traffic to v1 and 5% to v2 based on HTTP headers or percentage weights, monitoring error rates before promoting new releases.',
            'Key Metrics: p50/p90/p99 routing latency, active TCP connections, backend 5xx error spikes, health check flap rate, and bytes in vs. bytes out.',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'How to Ace the Load Balancer Interview' },
        {
          type: 'bullets',
          items: [
            'Start by clarifying scope: Ask whether the interviewer wants a high-throughput Layer 4 packet router (like AWS NLB / Maglev) or an application-layer Layer 7 reverse proxy (like AWS ALB / Envoy). Propose a two-tier architecture that covers both.',
            'Address the single-point-of-failure trap immediately: State clearly that the load balancer itself cannot be a single machine. Explain how Anycast BGP + ECMP or VRRP/Keepalived makes the LB tier fully redundant.',
            'Differentiate yourself with Direct Server Return (DSR) and Maglev consistent hashing. Explaining why outbound response traffic should bypass the load balancer shows true distributed systems depth.',
            'Discuss health check hysteresis: Never flip a server state on a single failed probe. Require 2–3 consecutive failures to mark dead, and 3 consecutive successes to restore.',
            'Walk through the numbers, not just the names: Being able to trace how a global connection count actually shrinks tier by tier (Anycast → ECMP → Maglev → L7) shows you understand the architecture rather than having memorized its component names.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Many candidates treat load balancers as magical black boxes with an icon in their diagram. Being able to explain how the load balancer itself handles 10M connections using Anycast, ECMP, Maglev hashing, and eBPF/XDP — and trace the actual numbers tier by tier — will instantly put you in the top 1% of system design interview candidates.',
        },
      ],
    },
  ],
};

const distributedCache: SystemDesignSystem = {
  id: 'distributed-cache',
  title: 'Distributed Cache / Key-Value Store',
  icon: 'ti-database-import',
  color: '#10b981',
  bg: '#d1fae5',
  accentGlow: 'rgba(16,185,129,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'The cornerstone of distributed systems — master CAP theorem, consistent hashing, and replication.',
  tags: ['CAP Theorem', 'Consistent Hashing', 'Replication', 'LRU/LFU', 'Gossip Protocol'],
  estimatedTime: '55 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A distributed key-value store like Redis, Memcached, or DynamoDB. A system that stores data as key-value pairs, distributes the data across multiple nodes, and provides fast reads/writes with high availability and fault tolerance.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'put(key, value) — store or update a key-value pair.',
            'get(key) → value — retrieve a value by key.',
            'delete(key) — remove a key-value pair.',
            'TTL support — keys expire after a configurable duration.',
            'Data is distributed across multiple nodes for scalability.',
            'Data is replicated across nodes for fault tolerance.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Highly available (reads and writes continue even if some nodes fail).',
            'Horizontally scalable (adding nodes increases capacity linearly).',
            'Low latency — P99 < 5ms for reads and writes.',
            'Consistency model: Tunable — support both strong and eventual consistency.',
            'Fault tolerant — no data loss when a node fails (with proper replication).',
          ],
        },
        { type: 'heading2', text: 'Scale Estimates' },
        {
          type: 'bullets',
          items: [
            '1 million QPS (queries per second) at peak.',
            '100 TB of data total.',
            '1 KB average value size → 100 billion keys.',
            'Average latency target: P50 < 1ms, P99 < 5ms.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'CAP Theorem' },
        {
          type: 'paragraph',
          text: 'CAP theorem states that a distributed system can guarantee at most 2 of the following 3 properties simultaneously:',
        },
        {
          type: 'bullets',
          items: [
            'Consistency (C): Every read returns the most recent write or an error. All nodes see the same data at the same time.',
            'Availability (A): Every request gets a response (success or failure), but it might not be the most recent data.',
            'Partition Tolerance (P): The system continues operating even when network partitions (split-brain) occur.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Network partitions are unavoidable in distributed systems. Therefore, every distributed system must choose between Consistency (CP) and Availability (AP). You cannot have all three. A distributed cache typically chooses AP (available + partition tolerant) with eventual consistency.',
        },
        { type: 'heading2', text: 'Consistent Hashing' },
        {
          type: 'paragraph',
          text: 'In a simple hash partitioning scheme, mapping a key to a node is: node = hash(key) % N. The problem: when N changes (add/remove a node), almost ALL keys need to be remapped.',
        },
        {
          type: 'paragraph',
          text: 'Consistent hashing fixes this by placing both nodes and keys on a "hash ring" (a circular space from 0 to 2^32-1). Each key is assigned to the first node clockwise on the ring from the key\'s position. When a node is added or removed, only the keys between the new/removed node and its predecessor are remapped — typically ~1/N keys.',
        },
        { type: 'heading2', text: 'Virtual Nodes (VNodes)' },
        {
          type: 'paragraph',
          text: 'Simple consistent hashing can create uneven distribution (some nodes get more keys). Virtual nodes solve this: each physical node is represented by many (e.g., 150) virtual positions on the ring. This spreads load more evenly and makes it easy to proportionally assign more ring positions to more powerful nodes.',
        },
        { type: 'heading2', text: 'Replication Factor & Quorum' },
        {
          type: 'bullets',
          items: [
            'Replication factor (RF): How many nodes store a copy of each key. RF=3 means each key is stored on 3 nodes.',
            'Write quorum (W): How many nodes must acknowledge a write for it to succeed. W=2 means 2 out of 3 replicas must confirm.',
            'Read quorum (R): How many nodes must respond to a read. R=2 means read from 2 replicas.',
            'Strong consistency: W + R > N (e.g., W=2, R=2, N=3). A read always overlaps with the most recent write.',
            'Eventual consistency: W=1, R=1. Maximum performance but reads might return stale data briefly.',
          ],
        },
        { type: 'heading2', text: 'Gossip Protocol' },
        {
          type: 'paragraph',
          text: "How do nodes know about each other's state? Gossip protocol: each node periodically selects a random peer and exchanges state information (which nodes are up/down, ring membership). State spreads through the cluster like a rumor — exponentially fast, O(log N) rounds to reach all nodes. No central coordinator needed.",
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Components' },
        {
          type: 'bullets',
          items: [
            'Client Library: SDK that clients use to interact with the cache. Handles hashing, routing to correct node, retry on failure.',
            'Coordinator Node: Receives client requests and routes them to the appropriate storage nodes based on consistent hashing.',
            'Storage Nodes: Actual data stores. Each node stores a portion of the keyspace. Multiple nodes hold replicas of each key.',
            'Gossip Protocol Layer: Background process on each node for cluster membership and failure detection.',
            'Merkle Trees: Used to detect inconsistencies between replicas during anti-entropy repair.',
          ],
        },
        { type: 'heading2', text: 'Read Path' },
        {
          type: 'numbered',
          items: [
            'Client sends GET(key) to the coordinator.',
            'Coordinator hashes the key, finds the N responsible nodes on the ring.',
            'Coordinator sends GET to R of the N replicas in parallel.',
            'First R responses returned. If values differ (stale replicas), return the newest (by vector clock/timestamp).',
            'Background process schedules read repair — updates stale replicas with the latest value.',
            'Return value to client.',
          ],
        },
        { type: 'heading2', text: 'Write Path' },
        {
          type: 'numbered',
          items: [
            'Client sends PUT(key, value) to the coordinator.',
            'Coordinator hashes the key, identifies the N responsible nodes.',
            'Coordinator sends PUT to all N replicas concurrently.',
            'Wait for W acknowledgements.',
            'Return success to client. The remaining (N-W) replicas will catch up asynchronously.',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Storage Engine — LSM Tree' },
        {
          type: 'paragraph',
          text: 'Most distributed KV stores use a Log-Structured Merge Tree (LSM Tree) storage engine. Writes are first written to an in-memory buffer (MemTable). When the MemTable fills, it is flushed to disk as an SSTable (Sorted String Table). SSTables are periodically merged (compacted) in the background.',
        },
        {
          type: 'bullets',
          items: [
            'Write performance: O(1) — always an in-memory write first. Much faster than B-Tree (which requires random disk I/O).',
            'Read performance: Slightly slower — may need to check multiple SSTables. Bloom filters on each SSTable allow quick "definitely not here" checks.',
            'Used by: RocksDB, Cassandra, LevelDB.',
          ],
        },
        { type: 'heading2', text: 'Eviction Policies' },
        {
          type: 'bullets',
          items: [
            'LRU (Least Recently Used): Evict the key that was accessed longest ago. Most common. Good hit rate for temporal access patterns.',
            'LFU (Least Frequently Used): Evict the key accessed least often. Better for items with long-term popularity. More complex to implement.',
            'FIFO: Evict the oldest key. Simple but poor cache efficiency.',
            'Random: Evict a random key. Surprisingly decent performance and very simple.',
            'Practical advice: LRU with O(1) implementation using a doubly-linked list + hash map. LFU when access frequency matters more than recency.',
          ],
        },
        { type: 'heading2', text: 'Write-Through vs. Write-Back vs. Cache-Aside' },
        {
          type: 'bullets',
          items: [
            'Cache-Aside (Lazy Loading): Application reads from cache. On miss, reads from DB and populates cache. On write, updates DB and invalidates cache. Most common pattern.',
            'Write-Through: Every write goes to cache AND DB synchronously. Cache is always warm. But: writes are slower.',
            'Write-Back: Write to cache only. Flush to DB asynchronously. Fastest writes, but risk of data loss if cache node fails before flushing.',
          ],
        },
        { type: 'heading2', text: 'Conflict Resolution — Vector Clocks' },
        {
          type: 'paragraph',
          text: 'When two clients write to the same key simultaneously (on different replicas during a partition), conflicts arise. Vector clocks track causality: each write carries a version vector {nodeA: 3, nodeB: 1}. When merging, if one vector dominates the other, use the newer value. If they are concurrent (neither dominates), surface the conflict to the application for resolution (e.g., last-writer-wins or merge semantics).',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Horizontal Scaling with Consistent Hashing' },
        {
          type: 'paragraph',
          text: 'Adding a new storage node requires moving only ~1/N of total keys. With 10 nodes and 100TB, adding an 11th node requires moving ~9TB. During migration, the new node fetches data from its neighboring nodes, which continue serving traffic. No downtime.',
        },
        { type: 'heading2', text: 'Read Scaling' },
        {
          type: 'bullets',
          items: [
            'Increase replication factor. With RF=5, you can serve reads from any 5 nodes (2 for quorum), doubling read throughput.',
            'Lower R (read quorum). R=1 gives maximum read throughput but risks stale reads.',
            'Add more nodes. With consistent hashing, each new node reduces the load on existing nodes proportionally.',
          ],
        },
        { type: 'heading2', text: 'Write Scaling' },
        {
          type: 'bullets',
          items: [
            'Lower W (write quorum). W=1 gives maximum write throughput but risks data loss.',
            'Add more nodes — writes are distributed across more nodes.',
            'Use the LSM tree for high write throughput — all writes are sequential memory writes.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Failure Detection — Gossip + Heartbeats' },
        {
          type: 'paragraph',
          text: 'Each node sends heartbeats every second. If a node misses 3 consecutive heartbeats (3 seconds), it is suspected to be down. Gossiped to all other nodes within ~log(N) seconds. Node is marked as DOWN after a configurable timeout.',
        },
        { type: 'heading2', text: 'Hinted Handoff' },
        {
          type: 'paragraph',
          text: 'What if a replica node is temporarily down during a write? The coordinator stores the write as a "hint" on a nearby node (a handoff node). When the downed node recovers, the handoff node replays the hinted writes to it. This maintains W acknowledgements during temporary failures without sacrificing durability.',
        },
        { type: 'heading2', text: 'Anti-Entropy Repair with Merkle Trees' },
        {
          type: 'paragraph',
          text: 'Over time, replicas can diverge (missed writes, network issues). Merkle trees allow efficient comparison: build a tree where each leaf is a hash of a key-value pair, and each internal node is a hash of its children. Comparing the root hashes of two replicas instantly tells if they differ. If they differ, traverse the tree to find exactly which keys differ — without transferring all data.',
        },
        { type: 'heading2', text: 'Handling Network Partitions' },
        {
          type: 'paragraph',
          text: 'During a partition, two groups of nodes cannot communicate. AP systems (like Cassandra) continue accepting reads and writes on both sides. When the partition heals, conflict resolution (vector clocks, last-writer-wins) merges the diverged state. CP systems (like etcd, ZooKeeper) refuse writes on the minority partition to prevent inconsistency.',
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Memory Management' },
        {
          type: 'bullets',
          items: [
            'Allocate a fixed amount of memory to the cache. When full, evict according to policy.',
            'Slab allocator (Memcached approach): Pre-allocate fixed-size memory chunks. Eliminates heap fragmentation. Keys and values are stored in power-of-2 sized slabs.',
            'Off-heap storage: Store data outside the JVM heap (for Java-based stores) to reduce GC pressure.',
          ],
        },
        { type: 'heading2', text: 'Bloom Filters for Read Optimization' },
        {
          type: 'paragraph',
          text: 'Before reading from SSTables, check a Bloom filter. If the Bloom filter says the key is "definitely not present," skip the SSTable read entirely. This eliminates unnecessary disk I/O for non-existent keys — a very common case in cache miss scenarios.',
        },
        { type: 'heading2', text: 'Connection Pooling & Pipelining' },
        {
          type: 'bullets',
          items: [
            'Maintain a pool of persistent connections between client and cache nodes.',
            'Redis pipelining: batch multiple commands in a single TCP packet. Reduces round-trips from N to 1 for N commands.',
            'Use binary protocol (Memcached binary, Redis RESP3) for efficient serialization.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Tunable Consistency (W + R vs. Latency)' },
        {
          type: 'bullets',
          items: [
            'W=3, R=2 (N=3): Strong consistency. Every read sees every write. Slower — must wait for 3 writes and 2 reads.',
            'W=1, R=1: Eventual consistency. Maximum speed. May read stale data for a brief period.',
            'W=2, R=2: Good balance for most use cases. Tolerates 1 node failure.',
            'Let the application choose consistency level per-request — Cassandra supports this as a first-class feature.',
          ],
        },
        { type: 'heading2', text: 'Single Leader vs. Multi-Leader vs. Leaderless' },
        {
          type: 'bullets',
          items: [
            'Single Leader (Redis): One primary accepts all writes. Simple consistency. Leader is a bottleneck. Failover takes seconds.',
            'Multi-Leader: Multiple nodes accept writes. Better write throughput. Complex conflict resolution.',
            'Leaderless (Cassandra, DynamoDB): Any node accepts writes. Maximum availability. Quorum determines consistency. More complex client logic.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Capacity Planning' },
        {
          type: 'bullets',
          items: [
            'Estimate peak QPS, average key/value size, total data size, and desired cache hit ratio.',
            'Over-provision by 30% to handle traffic spikes without performance degradation.',
            'Monitor memory usage continuously — approaching 100% memory causes thrashing.',
          ],
        },
        { type: 'heading2', text: 'Cache Stampede Prevention' },
        {
          type: 'paragraph',
          text: 'A cache stampede (thundering herd) happens when a popular key expires and thousands of requests simultaneously hit the database. Solutions:',
        },
        {
          type: 'bullets',
          items: [
            'Probabilistic early expiration: Before the key expires, probabilistically refresh it. The probability of refresh increases as expiry approaches.',
            'Mutex locking: Only one request is allowed to compute the new value. Others wait and receive the new value when it is ready.',
            'Background refresh: Serve slightly stale data while a background thread recomputes the fresh value.',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'Explain the CAP theorem and where a distributed cache falls.',
            'How does consistent hashing work and why is it better than simple modulo hashing?',
            'How would you implement LRU cache in O(1) time?',
            'What is eventual consistency and when is it acceptable?',
            'How do you handle a node failure in your distributed cache?',
            'Explain the difference between write-through and write-back caching.',
          ],
        },
        { type: 'heading2', text: 'Coding: LRU Cache in O(1)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `class LRUCache {
  private capacity: number;
  private map = new Map<number, number>(); // key → value (maintains insertion order)

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: number): number {
    if (!this.map.has(key)) return -1;
    // Move to end (most recently used)
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  put(key: number, value: number): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      // Delete the first (least recently used) entry
      this.map.delete(this.map.keys().next().value);
    }
    this.map.set(key, value);  // Add to end
  }
}`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'JavaScript Maps maintain insertion order, making them ideal for LRU implementation. Move accessed keys to the end; the first key is always the LRU. This is a very common coding interview question paired with the system design.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 4 — Chat / Messaging System
// ─────────────────────────────────────────────────────────────────────────────
const chatSystem: SystemDesignSystem = {
  id: 'chat-system',
  title: 'Chat / Messaging System',
  icon: 'ti-messages',
  color: '#3b82f6',
  bg: '#dbeafe',
  accentGlow: 'rgba(59,130,246,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Real-time communication at scale — WebSockets, fan-out, message ordering, and offline delivery.',
  tags: ['WebSockets', 'Fan-out', 'Message Ordering', 'Push Notifications', 'Long-polling'],
  estimatedTime: '60 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A real-time chat system like WhatsApp, Slack, or Facebook Messenger. Supports 1-on-1 messaging, group chats, online presence indicators, message history, and push notifications for offline users.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '1-on-1 messaging with real-time delivery.',
            'Group messaging (up to 500 members).',
            'Message history — retrieve past messages paginated.',
            'Online presence — know who is online.',
            'Message delivery status: sent → delivered → read receipts.',
            'Push notifications when the user is offline.',
            'Media sharing (images, videos) — out of scope for core design, handled separately.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '500 million daily active users (DAU).',
            '40 messages per user per day = 20 billion messages per day.',
            'Message latency: < 100ms for online delivery.',
            'Message persistence: stored for 5 years.',
            'High availability (99.99%) — chat must work even during partial failures.',
            'Message ordering must be maintained within a conversation.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'WebSockets' },
        {
          type: 'paragraph',
          text: 'HTTP is request-response — the server cannot push data to the client without a client request. WebSockets provide a persistent, bidirectional communication channel. After an initial HTTP handshake (Upgrade: websocket header), the connection becomes a full-duplex TCP connection.',
        },
        {
          type: 'bullets',
          items: [
            'The server can push messages to the client at any time.',
            'Much lower overhead than repeated HTTP polling.',
            'Maintains a persistent connection — requires connection management at scale.',
            'Not supported in all network environments (firewalls may block WebSocket upgrades).',
          ],
        },
        { type: 'heading2', text: 'Long-Polling (Fallback)' },
        {
          type: 'paragraph',
          text: 'The client sends an HTTP request. The server holds the request open until a message arrives (or a timeout of ~30 seconds). When a message arrives, the server responds and the client immediately sends another request. Simulates real-time without persistent connections. Higher latency and overhead than WebSockets but works everywhere.',
        },
        { type: 'heading2', text: 'Server-Sent Events (SSE)' },
        {
          type: 'paragraph',
          text: 'Server-to-client only. The server can push events over a single HTTP connection. Works through most firewalls. Ideal for notification feeds, live scoreboards, and other one-directional real-time streams. For bidirectional chat, use WebSockets.',
        },
        { type: 'heading2', text: 'Message Delivery Guarantees' },
        {
          type: 'bullets',
          items: [
            'At-most-once: Message sent once. If delivery fails, it is lost. Simplest, but messages can be dropped.',
            'At-least-once: Message retried until acknowledged. Recipient may receive duplicates. Requires deduplication (idempotency).',
            'Exactly-once: Message delivered exactly once, never duplicated. Most complex. Requires distributed transactions or idempotent consumers.',
            'For chat: At-least-once with client-side deduplication (using message IDs) is standard (WhatsApp approach).',
          ],
        },
        { type: 'heading2', text: 'Message Ordering' },
        {
          type: 'paragraph',
          text: 'In distributed systems, messages may arrive out of order. Solutions:',
        },
        {
          type: 'bullets',
          items: [
            'Sequence numbers: Each message in a conversation gets a monotonically increasing sequence number. Client reorders based on sequence.',
            'Lamport timestamps: Logical clocks that capture causality. Message B that was sent after message A will always have a higher timestamp.',
            'Snowflake IDs: Time-based unique IDs are sortable — messages with higher IDs were created later.',
          ],
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Core Components' },
        {
          type: 'bullets',
          items: [
            'Chat Servers: Handle WebSocket connections. Stateful — each server holds N persistent connections. Users connected to different chat servers need a way to exchange messages.',
            'Message Queue / Pub-Sub (Kafka/Redis Pub-Sub): Decouples chat servers. Server A publishes a message to the queue. Server B (where recipient is connected) subscribes and delivers to recipient.',
            'Message Store (Cassandra): Stores all messages persistently. Optimized for time-series data and high write throughput.',
            'Presence Service: Tracks online/offline status for all users using a distributed cache.',
            'Push Notification Service: Delivers notifications to offline users via APNs (iOS) / FCM (Android).',
            'User Service / API Gateway: Authentication, user profiles, REST API for non-real-time operations.',
            'Media Service: Handles image/video uploads separately via object storage (S3).',
          ],
        },
        { type: 'heading2', text: '1-on-1 Message Flow' },
        {
          type: 'numbered',
          items: [
            'User A sends a message to User B via WebSocket connection to Chat Server 1.',
            'Chat Server 1 stores the message in Cassandra and publishes it to Message Queue.',
            "Chat Server 2 (where User B is connected) subscribes to User B's channel and receives the message.",
            'Chat Server 2 delivers the message to User B via their WebSocket connection.',
            'If User B is offline: Chat Server 2 sees no active connection; routes to Push Notification Service.',
            'Delivery receipt flows back via the same path in reverse.',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Message Data Model (Cassandra)' },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Cassandra table optimized for chat message retrieval
CREATE TABLE messages (
  conversation_id  UUID,
  message_id       TIMEUUID,   -- time-based UUID for ordering
  sender_id        UUID,
  content          TEXT,
  message_type     TEXT,       -- 'text', 'image', 'video'
  status           TEXT,       -- 'sent', 'delivered', 'read'
  created_at       TIMESTAMP,
  PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
-- Partition by conversation, cluster by time → 
-- fast retrieval of latest messages in a conversation`,
        },
        { type: 'heading2', text: 'Fan-Out for Group Messages' },
        {
          type: 'paragraph',
          text: 'When User A sends a message to a group of 100 members, how do all 100 members receive it?',
        },
        {
          type: 'bullets',
          items: [
            "Fan-out on Write (Push model): When A sends a message, immediately copy it to each member's message inbox. 100 writes immediately. Recipients just read their own inbox (1 read). Best for small groups.",
            "Fan-out on Read (Pull model): Store the message once. Each recipient fetches the group's messages. 1 write. 100 reads per fetch. Best for large groups (celebrity problem solution).",
            'Hybrid: Fan-out on write for small groups (<= 100). Fan-out on read for large groups. This is what Twitter, WeChat use.',
          ],
        },
        { type: 'heading2', text: 'Presence Service Design' },
        {
          type: 'bullets',
          items: [
            'Each client sends a heartbeat to the Presence Service every 5 seconds.',
            'Presence data stored in Redis: {userId → lastSeen timestamp}.',
            'If lastSeen > 30 seconds ago → OFFLINE. Within 30s → ONLINE.',
            'When a user connects/disconnects, publish a presence event to subscribers (friends/contacts).',
            'Presence data is soft-state — it is acceptable to lose it on failure and rebuild via heartbeats.',
          ],
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'WebSocket Connection Scaling' },
        {
          type: 'paragraph',
          text: 'A single chat server can maintain ~50,000 concurrent WebSocket connections. For 500M DAU with ~10% online simultaneously = 50M connections → 50M / 50K = 1,000 chat servers.',
        },
        {
          type: 'bullets',
          items: [
            "A load balancer routes each user's initial WebSocket handshake to a chat server (sticky sessions based on user ID or consistent hashing).",
            'The load balancer keeps track of which server each user is on. When a message arrives, route it to the correct server.',
            'Or: Use a Service Registry (e.g., etcd). Chat servers register their connected users. Other servers can look up "which server is User B connected to?"',
          ],
        },
        { type: 'heading2', text: 'Cassandra Scaling' },
        {
          type: 'bullets',
          items: [
            '20 billion messages/day = ~230K writes/second.',
            'Cassandra is designed for this. Write path is a sequential log (CommitLog + MemTable).',
            "Partition by conversation_id. A conversation's messages always go to the same Cassandra partition (good for hot conversations — but with replication, distributed across nodes).",
            'Add more Cassandra nodes to scale linearly.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Message Durability' },
        {
          type: 'bullets',
          items: [
            'Messages are written to Cassandra BEFORE delivery is confirmed. Never confirm delivery before persistence.',
            'Cassandra replication factor = 3. Message survives loss of up to 2 nodes.',
            'Message queue (Kafka) provides durability during transit: messages are persisted on Kafka brokers before being delivered to consumers.',
          ],
        },
        { type: 'heading2', text: 'Handling Chat Server Failure' },
        {
          type: 'bullets',
          items: [
            'When a chat server goes down, all its WebSocket connections are lost.',
            'Clients detect the connection drop and automatically reconnect to a new chat server.',
            'The new server re-registers the user in the Service Registry.',
            'Missed messages: On reconnection, the client sends its last received message_id. The server fetches and delivers all messages with higher IDs.',
          ],
        },
        { type: 'heading2', text: 'Offline Message Delivery' },
        {
          type: 'bullets',
          items: [
            'Messages are stored in Cassandra regardless of recipient status.',
            'When the recipient comes online, the client fetches all unread messages (those with status ≠ "delivered") from their conversation history.',
            'Push notifications serve as the signal that a message is waiting — not as the message delivery mechanism itself.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Message Throughput Optimization' },
        {
          type: 'bullets',
          items: [
            'Batching: Accumulate multiple messages in a 50ms window and write to Cassandra in a batch. Reduces write amplification.',
            'Async writes: Write to message queue (Kafka) synchronously (fast). Write to Cassandra asynchronously. Trade: slight risk of message loss if Kafka fails before Cassandra write. Mitigate with Kafka replication.',
            'Read optimization: Cache the last 20 messages of each active conversation in Redis. 80% of reads are for recent messages.',
          ],
        },
        { type: 'heading2', text: 'Pagination for Message History' },
        {
          type: 'paragraph',
          text: 'Use cursor-based pagination for message history. The client receives a cursor (last message_id received). Next request: GET /messages?conversationId=X&before=<cursor>&limit=20. The server fetches 20 messages with message_id < cursor. This is efficient — no OFFSET scans, no out-of-range issues.',
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'WebSockets vs. Long-Polling' },
        {
          type: 'bullets',
          items: [
            'WebSockets: Lower latency, lower server resource usage (persistent connection). Requires WebSocket support (most firewalls OK now). Connection state is more complex.',
            'Long-Polling: Universal compatibility. Higher latency (~1-2s). Each poll creates a new HTTP request — more overhead. Easier to implement and debug.',
            'Recommendation: WebSockets as default, Long-Polling as fallback.',
          ],
        },
        { type: 'heading2', text: 'Fan-Out on Write vs. Read' },
        {
          type: 'bullets',
          items: [
            'Fan-out on write: Recipient always reads from their own pre-populated inbox (fast reads). But: sending to a 1000-person group requires 1000 writes — expensive for large groups.',
            'Fan-out on read: One write regardless of group size. But: reading the group timeline requires aggregating across all members.',
            'The hybrid approach is the industry standard. Define the threshold (e.g., 100 members) empirically based on your read-to-write ratio.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Monitoring' },
        {
          type: 'bullets',
          items: [
            'Track: message delivery latency (P50, P95, P99), WebSocket connection count per server, message queue lag, push notification delivery rate.',
            'Alert: If message delivery P99 > 500ms, queue consumer lag > 10 seconds, or push notification failure rate > 1%.',
          ],
        },
        { type: 'heading2', text: 'Regulatory Compliance' },
        {
          type: 'bullets',
          items: [
            "End-to-end encryption (E2EE): Messages encrypted on sender's device, decrypted only on recipient's device. Even the server cannot read content.",
            'Message retention policies: Legal requirements vary by country. Allow configurable retention (e.g., delete after 30 days).',
            'Right to deletion: GDPR compliance — users can request deletion of all their messages.',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'How would you deliver a message to a user who is connected to a different server than the sender?',
            'How do you handle message ordering in a distributed chat system?',
            'Design the fan-out mechanism for group messages in a group of 10,000 users.',
            'How do you show online presence for 500M users without querying the database on every check?',
            'How would you implement message read receipts?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'WebSockets for real-time, but mention Long-Polling as fallback.',
            'Message queue (Kafka/Redis Pub-Sub) for cross-server delivery — this is the non-obvious part that distinguishes good answers.',
            'Cassandra for message storage because of its write throughput and time-series query pattern.',
            'Fan-out on write for small groups, fan-out on read for large groups (hybrid).',
            'At-least-once delivery with client-side deduplication by message_id.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The hardest part of a chat system interview is explaining how messages cross server boundaries. The answer: a message queue (or pub-sub). Users subscribe to their own channel. When a message arrives for them, any subscriber (chat server they are connected to) delivers it. This is the insight that separates good answers from great ones.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 5 — Notification System
// ─────────────────────────────────────────────────────────────────────────────
const notificationSystem: SystemDesignSystem = {
  id: 'notification-system',
  title: 'Notification System',
  icon: 'ti-bell',
  color: '#ec4899',
  bg: '#fce7f3',
  accentGlow: 'rgba(236,72,153,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Async processing, Kafka pipelines, retry with backoff, and idempotency at massive scale.',
  tags: ['Kafka', 'Idempotency', 'APNs/FCM', 'Retry Backoff', 'Async Processing'],
  estimatedTime: '50 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A notification system that sends real-time alerts to users across multiple channels: push notifications (mobile/web), email, and SMS. Used by applications to notify users of events like new messages, promotions, alerts, or system events.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Support push notifications (iOS APNs, Android FCM), email (SendGrid/SES), and SMS (Twilio).',
            'Send notifications reliably — no message should be permanently lost.',
            'Support notification preferences — users can opt out of certain notification types.',
            'Deduplication — the same notification should not be delivered twice.',
            'Rate limiting — do not spam users with too many notifications in a short period.',
            'Scheduling — support delayed notifications.',
            'Analytics — track delivery, open, and click rates.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '10 million mobile push notifications per day.',
            '1 million SMS per day.',
            '5 million emails per day.',
            'Soft real-time — most notifications should arrive within 10 seconds.',
            'High availability — the system must be operational 99.9% of the time.',
            'Scalable — can add more throughput without redesign.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Push Notification Delivery (APNs & FCM)' },
        {
          type: 'bullets',
          items: [
            'Apple Push Notification Service (APNs): Apple\'s server that delivers push notifications to iOS devices. Your backend sends a notification payload to APNs; Apple handles the "last mile" to the device.',
            "Firebase Cloud Messaging (FCM): Google's equivalent for Android and web. Your backend sends to FCM; Google delivers to the device.",
            'Device Token: A unique identifier for each app installation on a device. Your backend stores this token and uses it to address notifications.',
            'Token expiry: Tokens can change (app reinstall, OS upgrade). Always handle invalid token errors from APNs/FCM and remove stale tokens.',
          ],
        },
        { type: 'heading2', text: 'Idempotency' },
        {
          type: 'paragraph',
          text: 'Idempotency means performing the same operation multiple times produces the same result. In notifications, this means sending the same notification twice should only result in the user receiving it once.',
        },
        {
          type: 'bullets',
          items: [
            'Generate a unique notification_id for every notification event.',
            'Before processing, check if notification_id is in a "processed" store (Redis or DB).',
            'If already processed, skip and acknowledge the queue message.',
            'If new, process it and add notification_id to the processed store.',
          ],
        },
        { type: 'heading2', text: 'Retry with Exponential Backoff' },
        {
          type: 'paragraph',
          text: 'When a third-party service (APNs, SendGrid) is temporarily unavailable, you must retry without hammering the service. Exponential backoff: wait 1s, then 2s, then 4s, then 8s... up to a maximum (e.g., 5 minutes). Add random jitter to prevent all retries from hitting the service simultaneously (thundering herd).',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `function retryDelay(attempt: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 300000; // 5 minutes
  const exponential = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add ±25% jitter
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(exponential + jitter);
}
// attempt=0: ~1000ms, attempt=3: ~8000ms, attempt=7: ~128000ms`,
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Components' },
        {
          type: 'bullets',
          items: [
            'Notification API: REST endpoint called by other services to trigger notifications. Validates, enriches (user preferences, device tokens), and publishes to message queue.',
            'Message Queue (Kafka): Decouples notification production from consumption. Topics: notifications-push, notifications-email, notifications-sms.',
            'Notification Workers: Consumers for each Kafka topic. Handles retry logic and third-party API calls.',
            'Third-Party Services: APNs (iOS push), FCM (Android push), SendGrid/AWS SES (email), Twilio (SMS).',
            'User Preferences Service: Stores user notification preferences. Called before sending to respect opt-outs.',
            'Device Token Store: Maps user_id → [device_tokens]. Stored in a key-value store (Redis or DynamoDB).',
            'Notification Log Store: Records every notification with its status for analytics and debugging.',
            'Retry Queue: Failed notifications are placed here with a scheduled retry time.',
          ],
        },
        { type: 'heading2', text: 'Notification Flow' },
        {
          type: 'numbered',
          items: [
            'Application Service (e.g., Order Service) calls POST /api/notifications with {userId, type: "push", template: "order_confirmed", data: {...}}',
            'Notification API checks user preferences — does the user allow this notification type?',
            'Fetch device tokens for the user from the Device Token Store.',
            'Publish to Kafka topic: notifications-push with notification_id, userId, tokens, payload.',
            'Push Notification Worker consumes from Kafka, calls APNs/FCM API.',
            'On success: log delivery status. On failure: publish to retry queue with backoff delay.',
            'Analytics service consumes all notification events for tracking.',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Notification Data Model' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE notifications (
  notification_id  UUID PRIMARY KEY,
  user_id          UUID NOT NULL,
  channel          VARCHAR(10) NOT NULL,  -- 'push', 'email', 'sms'
  template_id      VARCHAR(50),
  payload          JSONB,
  status           VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
  retry_count      INT DEFAULT 0,
  scheduled_at     TIMESTAMP,
  sent_at          TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW()
);`,
        },
        { type: 'heading2', text: 'Template Engine' },
        {
          type: 'paragraph',
          text: 'Notifications use templates with variable substitution, not hardcoded strings. This allows A/B testing different messages and localization without code changes.',
        },
        {
          type: 'code',
          lang: 'json',
          code: `// Template: order_confirmed
{
  "en": {
    "title": "Order #{orderId} Confirmed!",
    "body": "Hi {userName}, your order totaling \${amount} is confirmed.",
    "action": "view_order"
  },
  "es": {
    "title": "¡Pedido #{orderId} Confirmado!",
    "body": "Hola {userName}, tu pedido de \${amount} está confirmado."
  }
}`,
        },
        { type: 'heading2', text: 'Deduplication Store' },
        {
          type: 'paragraph',
          text: 'Use Redis with a short TTL (e.g., 24 hours) as the deduplication store.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `async function processNotification(notifId: string, payload: any) {
  const dedupeKey = \`notif:sent:\${notifId}\`;
  const alreadySent = await redis.set(dedupeKey, '1', 'NX', 'EX', 86400);
  if (!alreadySent) {
    console.log('Duplicate notification, skipping:', notifId);
    return; // Already processed
  }
  // Process the notification...
  await sendPushNotification(payload);
}`,
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Kafka Partitioning' },
        {
          type: 'paragraph',
          text: 'Partition Kafka topics by notification channel or user_id. With 10M notifications/day = ~116/second, a few Kafka partitions suffice. For 1B/day = 11,600/second, use more partitions and worker instances.',
        },
        { type: 'heading2', text: 'Worker Auto-scaling' },
        {
          type: 'paragraph',
          text: 'Monitor Kafka consumer group lag (the number of messages waiting to be consumed). If lag grows, auto-scale notification workers (add more pod replicas in Kubernetes). Scale down when lag is low. This provides elastic capacity without over-provisioning.',
        },
        { type: 'heading2', text: 'Third-Party API Rate Limits' },
        {
          type: 'bullets',
          items: [
            'APNs: No published rate limit but throttles under sustained high load.',
            'FCM: 600,000 messages per minute per project.',
            'Twilio SMS: Varies by account tier (typically 1 msg/sec for short codes).',
            'SendGrid Email: Varies by plan (typically 100 emails/second on paid plans).',
            'Use token bucket rate limiters per channel to stay within third-party limits.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'At-Least-Once Delivery with Kafka' },
        {
          type: 'paragraph',
          text: 'Kafka consumers commit offsets only after successfully processing a message. If a worker crashes after processing but before committing, the message is re-delivered. Idempotency handling ensures the second delivery is a no-op.',
        },
        { type: 'heading2', text: 'Dead Letter Queue (DLQ)' },
        {
          type: 'paragraph',
          text: 'After N failed retries (e.g., 5), move the message to a Dead Letter Queue. DLQ messages are not automatically retried — they require manual investigation. Monitor DLQ size; a growing DLQ indicates a systemic problem with a channel (e.g., APNs is rejecting all messages).',
        },
        { type: 'heading2', text: 'Graceful Handling of Third-Party Outages' },
        {
          type: 'bullets',
          items: [
            'APNs/FCM outage: Notifications accumulate in the retry queue. Deliver when the service recovers.',
            'Kafka outage: Notification API writes fail. Use a local fallback queue (database table) to buffer events until Kafka recovers.',
            'Circuit breaker: After 50% of APNs calls fail in 1 minute, open the circuit — stop calling APNs for 30 seconds, let all messages accumulate in the retry queue.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Batching Notifications' },
        {
          type: 'bullets',
          items: [
            'FCM and APNs support batch sending (up to 500 notifications per API call).',
            'Accumulate notifications in a 100ms window, then batch-send. Dramatically reduces API calls and improves throughput.',
            'Trade-off: Slight increase in notification latency (up to 100ms delay).',
          ],
        },
        { type: 'heading2', text: 'Priority Queues' },
        {
          type: 'paragraph',
          text: 'Not all notifications are equally urgent. Use separate Kafka topics (or queue priorities):',
        },
        {
          type: 'bullets',
          items: [
            'Critical (security alerts, OTP codes): Immediate, no batching.',
            'High (new messages, order updates): < 5 second delivery.',
            'Normal (promotions, recommendations): < 60 second delivery.',
            'Low (weekly digest, reports): Batch and send at scheduled times.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Synchronous vs. Asynchronous Notification Sending' },
        {
          type: 'bullets',
          items: [
            "Synchronous: Caller waits for notification to be delivered. Simple, but the caller's request is blocked by third-party latency (APNs: 50-200ms). Not scalable.",
            'Asynchronous (recommended): Caller triggers notification by publishing to a queue and returns immediately. Workers process asynchronously. Caller sees fast response; notification delivered shortly after.',
          ],
        },
        { type: 'heading2', text: 'Single Notification Service vs. Per-Channel Services' },
        {
          type: 'bullets',
          items: [
            'Single service: Simpler to deploy and monitor. Shared code. But: an APNs outage could affect email sending if not carefully isolated.',
            'Per-channel microservices (PushService, EmailService, SmsService): Better isolation. Can scale independently. But: more services to manage.',
            'Recommendation: Start with a single service with internal channel isolation. Split to microservices when channel-specific scale demands it.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Analytics & Observability' },
        {
          type: 'bullets',
          items: [
            'Track: notification volume by channel, delivery success rate, delivery latency, open rate, click rate, unsubscribe rate.',
            'A/B test notification templates — send different messages to subsets of users and measure engagement.',
            'Spam detection: Flag users who unsubscribe frequently after notifications from a specific source.',
          ],
        },
        { type: 'heading2', text: 'User Preference Management' },
        {
          type: 'bullets',
          items: [
            'Store preferences in a database (user_id → notification_type → enabled/disabled).',
            'Cache preferences in Redis (short TTL) for fast lookup during the notification flow.',
            'Support global opt-out (no notifications at all) and per-type opt-out.',
            "Respect quiet hours (e.g., do not send push notifications between 10pm and 8am in the user's timezone).",
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'How do you ensure a notification is delivered exactly once?',
            'How would you design the retry mechanism for failed notifications?',
            'How would you handle the scenario where APNs is down for 2 hours?',
            'How do you handle user notification preferences at scale?',
            'How would you scale the system from 1M to 1B notifications per day?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Kafka as the backbone for decoupling and reliability.',
            'Idempotency with notification_id and Redis deduplication.',
            'Retry with exponential backoff + jitter.',
            'Dead Letter Queue for permanently failed notifications.',
            'Priority queues for time-sensitive vs. bulk notifications.',
            'Template engine for localization and A/B testing.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interviewers love depth on the reliability side of notification systems. Always bring up: idempotency, DLQ, exponential backoff, and third-party API rate limits. These show production engineering maturity.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 6 — File & Object Storage (S3-like)
// ─────────────────────────────────────────────────────────────────────────────
const fileStorage: SystemDesignSystem = {
  id: 'file-storage',
  title: 'File & Object Storage',
  icon: 'ti-cloud-upload',
  color: '#f97316',
  bg: '#ffedd5',
  accentGlow: 'rgba(249,115,22,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'CDN, chunked uploads, metadata databases, and eventual consistency — the building blocks of S3.',
  tags: ['CDN', 'Chunked Upload', 'Presigned URLs', 'Object Storage', 'Eventual Consistency'],
  estimatedTime: '55 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A distributed object storage system like Amazon S3, Google Cloud Storage, or Dropbox. Users can upload, download, share, and manage files of any size. The system stores billions of objects reliably across commodity hardware.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Upload files (any size, up to 5 GB per file).',
            'Download files by key/URL.',
            'Delete files.',
            'List files in a namespace (bucket/folder).',
            'File versioning — keep previous versions of a file.',
            'Access control — public or private files, shared with specific users.',
            'Presigned URLs — generate time-limited URLs for accessing private files.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '1 billion total objects stored.',
            '10 PB of total data.',
            '99.999999999% (11 nines) data durability.',
            '99.99% availability.',
            'Files must be retrievable within seconds.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Object Storage vs. Block Storage vs. File Storage' },
        {
          type: 'bullets',
          items: [
            'Object Storage: Files stored as flat objects with metadata and a unique key. No hierarchy. Highly scalable, cheap. Examples: S3, Azure Blob. Best for images, videos, backups, large data.',
            'Block Storage: Data stored in fixed-size blocks (like hard drives). Used by databases and OS. Low latency but expensive at scale. Examples: AWS EBS.',
            'File Storage: Hierarchical filesystem (directories, subdirectories). Familiar but harder to scale. Examples: NFS, AWS EFS.',
          ],
        },
        { type: 'heading2', text: 'Chunked (Multipart) Upload' },
        {
          type: 'paragraph',
          text: 'Uploading a 5 GB file as a single HTTP request is risky — any network interruption means restarting the entire upload. Multipart upload breaks the file into chunks (e.g., 8 MB each). Each chunk is uploaded independently. If one chunk fails, only that chunk needs to be retried. Chunks are reassembled on the server side after all parts are uploaded.',
        },
        { type: 'heading2', text: 'Content Delivery Network (CDN)' },
        {
          type: 'paragraph',
          text: 'A CDN is a globally distributed network of edge servers that cache content close to users. Instead of a user in Tokyo downloading a file from a data center in Virginia (high latency), they download from a CDN edge node in Tokyo (low latency). CDNs are essential for serving static files, images, and videos at global scale.',
        },
        { type: 'heading2', text: 'Presigned URLs' },
        {
          type: 'paragraph',
          text: 'To allow temporary access to a private object without exposing permanent credentials, generate a presigned URL: a URL that includes a cryptographic signature and expiry time. The storage service validates the signature and grants access only within the time window. Clients upload directly to storage using presigned URLs — the application backend never sees the file bytes.',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Upload Flow' },
        {
          type: 'numbered',
          items: [
            'Client requests a presigned upload URL from the API Service: POST /api/files/upload-url',
            'API Service validates auth, creates a file metadata record (status: pending), returns a presigned URL pointing to the Storage Service.',
            'Client uploads the file bytes directly to the Storage Service using the presigned URL (bypassing the API Service).',
            'Storage Service stores the file, notifies the API Service via an event (Kafka/SNS).',
            'API Service updates the file metadata (status: active, size, checksum).',
            'Client receives the file_id and can construct the CDN URL.',
          ],
        },
        { type: 'heading2', text: 'Download Flow' },
        {
          type: 'numbered',
          items: [
            'Client requests the file URL via GET /api/files/{fileId}.',
            'API Service validates access permissions.',
            'If public: Return the CDN URL. CDN serves from edge cache if present; otherwise fetches from origin (Storage Service).',
            'If private: Generate and return a time-limited presigned CDN URL (e.g., valid for 1 hour).',
          ],
        },
        { type: 'heading2', text: 'Components' },
        {
          type: 'bullets',
          items: [
            'API Service: Handles auth, metadata, presigned URL generation. Stateless.',
            'Storage Service (Data Nodes): Stores actual file data across commodity servers using erasure coding or replication.',
            'Metadata Database: Stores file metadata (name, size, owner, storage location, checksum). PostgreSQL or DynamoDB.',
            'CDN: Cloudflare or AWS CloudFront for global file distribution.',
            'Message Queue: Event-driven updates between components (file uploaded → update metadata).',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Erasure Coding for Durability (vs. Replication)' },
        {
          type: 'paragraph',
          text: 'Simple replication (3 copies) requires 3× storage overhead. Erasure coding (e.g., Reed-Solomon 10+4) splits data into 10 data shards + 4 parity shards. Any 10 of the 14 shards can reconstruct the original. Only 1.4× storage overhead (vs. 3× for replication) but provides equivalent or higher durability.',
        },
        {
          type: 'bullets',
          items: [
            'S3 uses Reed-Solomon erasure coding to achieve 11 nines of durability.',
            'Data and parity shards are spread across different servers and availability zones.',
            'Higher compute cost for encode/decode vs. simple replication.',
          ],
        },
        { type: 'heading2', text: 'Metadata Database Schema' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE files (
  file_id       UUID PRIMARY KEY,
  bucket_id     UUID NOT NULL,
  owner_id      UUID NOT NULL,
  name          VARCHAR(1024),
  size_bytes    BIGINT,
  content_type  VARCHAR(255),
  checksum_md5  CHAR(32),
  storage_path  TEXT,          -- Internal path on storage nodes
  version       INT DEFAULT 1,
  status        VARCHAR(20) DEFAULT 'active', -- active, deleted, pending
  is_public     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);`,
        },
        { type: 'heading2', text: 'File Deduplication' },
        {
          type: 'paragraph',
          text: 'If two users upload the same file, store only one copy. Use content-addressed storage: compute a hash (SHA-256) of the file content. The storage key is the hash. If the hash already exists in storage, just create a new metadata record pointing to the existing data. This can dramatically reduce storage costs in consumer applications.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Metadata Scaling' },
        {
          type: 'bullets',
          items: [
            'Shard the metadata database by bucket_id or owner_id.',
            'Use a dedicated metadata cluster — metadata reads/writes are much higher frequency than data reads/writes.',
            'Cache frequently accessed metadata in Redis.',
          ],
        },
        { type: 'heading2', text: 'Data Storage Scaling' },
        {
          type: 'bullets',
          items: [
            'Add storage nodes horizontally. Consistent hashing assigns objects to nodes.',
            'Use a distributed block storage layer (e.g., Ceph) under the hood.',
            'Tiered storage: hot data on SSDs (expensive, fast), cold data on HDDs or archive storage (cheap, slow, high latency).',
          ],
        },
        { type: 'heading2', text: 'CDN Scaling' },
        {
          type: 'paragraph',
          text: 'CDNs scale automatically by adding edge nodes globally. No action needed from the application side. Ensure cache-control headers are set correctly (max-age) to maximize CDN cache hit rates.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Data Integrity — Checksums' },
        {
          type: 'paragraph',
          text: 'Compute an MD5 or SHA-256 checksum of the file on the client before upload. The storage service recomputes the checksum after storing and returns an error if they do not match. This detects bit-flip errors during transfer. Periodically re-verify checksums stored on disk to detect hardware failures (bit rot).',
        },
        { type: 'heading2', text: 'Consistency Model' },
        {
          type: 'bullets',
          items: [
            'S3 offers strong read-after-write consistency since 2020: after a successful PUT, any GET will return the new version.',
            'Before 2020, S3 was eventually consistent: a GET immediately after PUT might return the old version (or 404 if the object was new).',
            'For your design: use an RDBMS for metadata (strong consistency) and accept eventual consistency for CDN propagation (content changes take seconds to minutes to propagate to all edge nodes).',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Byte-Range Requests' },
        {
          type: 'paragraph',
          text: 'HTTP supports range requests: GET /file with Range: bytes=0-1048576 fetches only the first 1 MB. This enables resumable downloads (restart from where you left off), video streaming (seek to specific timestamp), and parallel downloading (multiple parts simultaneously).',
        },
        { type: 'heading2', text: 'Transfer Acceleration' },
        {
          type: 'paragraph',
          text: "Clients upload to the nearest CDN edge node, which then uploads to the storage origin over AWS's optimized backbone network. Reduces upload latency for geographically distant clients by 50-80%.",
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Replication vs. Erasure Coding' },
        {
          type: 'bullets',
          items: [
            'Replication: Simpler to implement, faster reads (read from nearest replica), higher storage cost (3× for RF=3).',
            'Erasure Coding: Complex to implement, slower reads/writes (encode/decode CPU cost), much lower storage cost (1.4× for 10+4 RS).',
            'Use replication for frequently accessed, latency-sensitive data. Use erasure coding for cold or archival data where storage cost dominates.',
          ],
        },
        { type: 'heading2', text: 'Upload via API vs. Direct to Storage' },
        {
          type: 'bullets',
          items: [
            'API proxy upload: Simple client code, API has full control. But: API bandwidth is a bottleneck and cost.',
            'Direct upload via presigned URL: Client uploads to storage directly, no API bandwidth cost. But: harder to validate files before storage.',
            'Recommended: Direct upload with post-upload processing (metadata update, virus scan) triggered asynchronously.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Security' },
        {
          type: 'bullets',
          items: [
            'Encrypt data at rest (AES-256).',
            'Encrypt data in transit (TLS 1.2+).',
            'Server-side encryption with customer-managed keys (BYOK) for compliance.',
            'Access logging: Record every download for audit trails.',
            'Malware scanning: Run uploaded files through a virus scanner before making them accessible.',
          ],
        },
        { type: 'heading2', text: 'Cost Optimization' },
        {
          type: 'bullets',
          items: [
            'Lifecycle policies: Automatically move files from hot → warm → cold → archive storage as they age.',
            'Intelligent tiering: Automatically move objects between tiers based on access frequency.',
            'CDN caching: Reduce origin egress costs — CDN-served requests are cheaper than origin-served.',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'How would you design a system that stores 1 billion files with 11 nines of durability?',
            'How do you implement resumable uploads for large files?',
            'How do you secure access to private files?',
            'Explain erasure coding vs. replication.',
            'How does a CDN work and where does it fit in your design?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Presigned URLs: upload directly from client to storage, bypass API layer.',
            'Chunked upload for reliability (resume on failure).',
            'Erasure coding for durability without 3× storage cost.',
            'Content-addressed storage for deduplication.',
            'Separate metadata and data stores — different access patterns, different scaling needs.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Emphasize that the API Service never handles actual file bytes — presigned URLs route uploads/downloads directly to/from the storage layer. This is a key insight that shows you understand how production object storage works.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 7 — News Feed / Social Media Feed
// ─────────────────────────────────────────────────────────────────────────────
const newsFeed: SystemDesignSystem = {
  id: 'news-feed',
  title: 'News Feed / Social Media Feed',
  icon: 'ti-layout-list',
  color: '#8b5cf6',
  bg: '#ede9fe',
  accentGlow: 'rgba(139,92,246,0.15)',
  difficulty: 'Advanced',
  tagline: 'Fan-out strategies, graph data, ranking algorithms, and infinite scroll pagination.',
  tags: ['Fan-out on Write', 'Graph Database', 'Redis Sorted Sets', 'Ranking', 'Cursor Pagination'],
  estimatedTime: '65 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: "A social media news feed like Facebook's News Feed or Twitter's Home Timeline. When you open the app, you see a ranked, personalized list of recent posts from people and pages you follow. New posts appear in near real-time.",
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Users can post content (text, images, links).',
            'Users can follow/unfollow other users.',
            'Home timeline shows posts from followed users, ranked by relevance/time.',
            'New posts appear in the feed within seconds.',
            'Support infinite scroll pagination.',
            'Posts can be liked, commented on, and shared.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '300 million DAU (like Twitter).',
            'Each user follows ~300 accounts on average.',
            '1 million posts published per day.',
            'Feed reads are 100× more frequent than writes.',
            'Feed load time: < 200ms.',
            'High availability — feeds must be readable even during partial outages.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Fan-out on Write (Push Model)' },
        {
          type: 'paragraph',
          text: 'When a user publishes a post, immediately write a copy of the post ID to the feed (inbox) of every follower. Followers read their own feed inbox, which is always pre-populated.',
        },
        {
          type: 'bullets',
          items: [
            'Reads are extremely fast — O(1) read from pre-computed feed.',
            'Writes are expensive — 1 post from a user with 1M followers = 1M write operations.',
            'Celebrity problem: A user with 1M followers causes 1M writes per post — can overwhelm the system.',
            'Best for users with few followers.',
          ],
        },
        { type: 'heading2', text: 'Fan-out on Read (Pull Model)' },
        {
          type: 'paragraph',
          text: 'When a user requests their feed, query the database for posts from all followed accounts, merge and rank them in real-time.',
        },
        {
          type: 'bullets',
          items: [
            'Writes are cheap — just store the post once.',
            'Reads are expensive — must query all followed accounts, merge, rank. If user follows 300 accounts, that is 300 queries.',
            'Adding caching helps but the underlying approach is expensive at scale.',
            'Best for celebrities (many followers) since write fan-out is impractical.',
          ],
        },
        { type: 'heading2', text: 'Hybrid Approach (Industry Standard)' },
        {
          type: 'paragraph',
          text: "Use fan-out on write for regular users. Use fan-out on read for celebrities (e.g., users with > 10K followers). Regular users' posts get pushed to all followers. Celebrity posts are fetched at read time and merged with the pre-computed feed.",
        },
        {
          type: 'callout',
          variant: 'tip',
          text: "This is what Facebook, Twitter, and Instagram use. The threshold (10K followers) is tunable based on your system's performance characteristics.",
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Components' },
        {
          type: 'bullets',
          items: [
            'Post Service: Accepts new posts, validates, stores in Post DB, triggers fan-out.',
            'Fan-out Service: Consumes post events from Kafka, writes post IDs to follower feed inboxes in Redis.',
            'Graph Service: Manages follow/unfollow relationships. Stored in a graph-friendly structure (adjacency list in Redis or a graph DB).',
            'Feed Service: When user requests their feed, reads their Redis feed inbox, fetches full post data for each post ID, applies ranking, returns paginated results.',
            'Post Store (Cassandra): Stores post content, metadata. Partitioned by post_id.',
            'Feed Store (Redis): Each user has a sorted set: {user_id} → [{post_id, score (timestamp)}]. Stores the most recent 1000 posts.',
            'Ranking Service: Computes feed ranking scores based on recency, engagement, and user relationships.',
            'Kafka: Event bus for decoupling post creation from fan-out.',
          ],
        },
        { type: 'heading2', text: 'Post Creation Flow' },
        {
          type: 'numbered',
          items: [
            'User submits a post via POST /api/posts.',
            'Post Service validates, stores post in Cassandra, publishes {postId, userId, timestamp} to Kafka topic "new-posts".',
            "Fan-out Service consumes the event. Fetches the user's follower list from Graph Service.",
            "For regular users: Write postId to each follower's Redis sorted set (score = timestamp).",
            "Trim each user's sorted set to 1000 entries (remove oldest).",
            'For celebrity users: Skip fan-out. Post is fetched at read time.',
          ],
        },
        { type: 'heading2', text: 'Feed Read Flow' },
        {
          type: 'numbered',
          items: [
            'User requests their feed: GET /api/feed?cursor=<lastPostId>',
            "Feed Service reads the user's sorted set from Redis: get 20 post IDs from the sorted set after the cursor.",
            'If user follows celebrities: additionally fetch their latest post IDs from the Graph Service.',
            'Merge all post IDs, apply ranking score.',
            'Batch-fetch full post data from Cassandra for the top 20 posts.',
            'Return posts with next_cursor for pagination.',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Redis Sorted Set for Feed Storage' },
        {
          type: 'code',
          lang: 'text',
          code: `Key: "feed:{userId}"
Type: Sorted Set
Members: post IDs
Score: Unix timestamp of the post

Commands:
ZADD feed:{userId} {timestamp} {postId}  → Add post to feed
ZRANGE feed:{userId} 0 19 REV            → Get 20 most recent posts
ZRANGEBYSCORE feed:{userId} -{cursor} -inf REV LIMIT 0 20  → Cursor pagination
ZREMRANGEBYRANK feed:{userId} 0 -1001    → Trim to 1000 newest`,
        },
        { type: 'heading2', text: 'Ranking Algorithm' },
        {
          type: 'paragraph',
          text: 'Pure chronological feeds are simple but low engagement. A ranking algorithm considers:',
        },
        {
          type: 'bullets',
          items: [
            'Recency: More recent posts scored higher.',
            'Engagement: Posts with many likes/comments from your connections score higher.',
            'Relationship strength: Posts from users you interact with frequently score higher.',
            'Content type preference: If you always engage with videos, video posts score higher.',
            'Practical: Use a simple scoring formula initially. Add ML-based ranking as the product matures.',
          ],
        },
        { type: 'heading2', text: 'Post Data Schema (Cassandra)' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE posts (
  post_id     TIMEUUID PRIMARY KEY,
  user_id     UUID,
  content     TEXT,
  media_urls  LIST<TEXT>,
  like_count  COUNTER,
  comment_count COUNTER,
  share_count COUNTER,
  created_at  TIMESTAMP
);`,
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Feed Store Scaling' },
        {
          type: 'bullets',
          items: [
            "Redis Cluster shards feed sorted sets by user_id. Each user's feed is on one Redis node — no cross-shard operations needed.",
            'Store only post IDs (not full post content) in the feed. Post content fetched from Cassandra.',
            'Limit feed inbox to 1000 posts. Older posts fetched directly from the Post Store when needed.',
          ],
        },
        { type: 'heading2', text: 'Fan-out Scaling' },
        {
          type: 'bullets',
          items: [
            'Fan-out Service scales horizontally. Add more Kafka consumers to handle higher post volume.',
            'For high-follower users (100K+): fan-out is slow. Use a dedicated "high-follower fan-out" queue with more workers.',
            'Asynchronous fan-out: The post is immediately visible to the poster. Followers see it within seconds as the fan-out completes.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Feed Reconstruction' },
        {
          type: 'paragraph',
          text: "If a user's Redis feed cache is lost (Redis node failure), reconstruct it: query Graph Service for all followed users, fetch their recent posts from Cassandra, rebuild the sorted set. This is slow (seconds) but only needed after failures.",
        },
        { type: 'heading2', text: 'Handling Kafka Fan-out Lag' },
        {
          type: 'paragraph',
          text: 'If Kafka consumers fall behind (fan-out lag), followers see delayed posts. Solution:',
        },
        {
          type: 'bullets',
          items: [
            'Auto-scale fan-out workers based on Kafka consumer lag.',
            "Fall back to on-demand fan-out: if the user's feed is more than 5 minutes stale, fetch from Post Store at read time.",
            'Prioritize fan-out for users who are currently online (likely to view feed immediately).',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Infinite Scroll with Cursor Pagination' },
        {
          type: 'paragraph',
          text: 'Do NOT use offset-based pagination (LIMIT 20 OFFSET 200). As the offset increases, the database must scan and discard 200 rows — latency grows linearly. Use cursor-based pagination: the cursor is the score (timestamp) of the last post seen. Next page: fetch posts with score < cursor. O(log N) with the sorted set, regardless of page number.',
        },
        { type: 'heading2', text: 'Multi-Level Caching' },
        {
          type: 'bullets',
          items: [
            'L1 Cache: Pre-computed feed in Redis (post IDs only). Serves 95% of feed requests.',
            'L2 Cache: Cassandra serves full post data with post_id lookups. Hot posts also cached in Redis.',
            'CDN: Static media (images, videos in posts) served from CDN edge nodes.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Chronological vs. Ranked Feed' },
        {
          type: 'bullets',
          items: [
            'Chronological: Predictable, fair, no algorithmic filtering. Users see everything from followed accounts in order. Simple to implement.',
            'Ranked: Higher engagement (users see most relevant content first). But: users may miss important posts. Requires complex ranking infrastructure. Creates concerns about algorithmic bias.',
            'Product decision: Many platforms are reverting to chronological feeds due to user preference.',
          ],
        },
        { type: 'heading2', text: 'Storing Post IDs vs. Full Posts in Feed' },
        {
          type: 'bullets',
          items: [
            'Post IDs only (indirection): Feed is small (post IDs are ~16 bytes). Post content fetched on demand. Feed does not go stale when post is edited.',
            'Full post snapshots: No additional DB lookup for feed render. But: feed can contain stale content if post is edited. Storage cost is much higher.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Content Moderation' },
        {
          type: 'bullets',
          items: [
            'Filter prohibited content before publishing (image/text classification).',
            "Shadowbanning: Keep content in the poster's view but exclude from other users' feeds.",
            'Report + review workflow: Users report content, human moderators review flagged posts.',
          ],
        },
        { type: 'heading2', text: 'Privacy & Feed Integrity' },
        {
          type: 'bullets',
          items: [
            "When a user blocks another, remove blocked user's posts from the requester's feed.",
            'When a post is deleted, remove post ID from all feed inboxes (fan-out deletion — expensive for popular posts).',
            "When a user unfollows, remove their posts from the follower's feed (fan-out on unfollow).",
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'Explain fan-out on write vs. fan-out on read.',
            'How do you handle celebrities with millions of followers in your fan-out design?',
            'How would you implement infinite scroll pagination efficiently?',
            'How do you rank posts in the feed?',
            'How do you keep the feed fresh when posts are deleted or edited?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Hybrid fan-out is the industry answer for celebrity problem — know the threshold.',
            'Redis sorted sets for feed storage — very specific and shows depth.',
            'Cursor-based pagination is non-negotiable at scale — explain why offset pagination fails.',
            'Feed reconstruction on cache miss — shows you thought about failure scenarios.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The news feed is one of the most common system design interview questions. Knowing the hybrid fan-out approach, Redis sorted sets, and cursor pagination puts you in the top 10% of candidates. Practice explaining the celebrity problem and its solution clearly.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 8 — Video Streaming Platform (YouTube-like)
// ─────────────────────────────────────────────────────────────────────────────
const videoStreaming: SystemDesignSystem = {
  id: 'video-streaming',
  title: 'Video Streaming Platform',
  icon: 'ti-player-play',
  color: '#ef4444',
  bg: '#fee2e2',
  accentGlow: 'rgba(239,68,68,0.15)',
  difficulty: 'Advanced',
  tagline:
    'Video encoding pipelines, adaptive bitrate streaming, CDN delivery, and billion-scale view counts.',
  tags: ['HLS/DASH', 'Adaptive Bitrate', 'Transcoding', 'CDN', 'Blob Storage'],
  estimatedTime: '70 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A video streaming platform like YouTube or Netflix. Users can upload videos, which are processed and made available for streaming at different quality levels. Other users can search, discover, and stream videos with adaptive quality based on their network speed.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Video upload (up to 4K, up to 10 GB).',
            'Video processing: transcode to multiple resolutions (360p, 480p, 720p, 1080p, 4K).',
            'Adaptive bitrate streaming — quality adjusts to network speed automatically.',
            'Video search and discovery.',
            'View count, likes, comments.',
            'Video recommendations.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '5 million videos uploaded per day.',
            '5 billion video views per day.',
            'Processing SLA: video available for streaming within 5 minutes of upload.',
            'Video start latency: < 2 seconds.',
            'No buffering for users on 5 Mbps+ connections.',
            'Global availability.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Video Codec and Container Formats' },
        {
          type: 'bullets',
          items: [
            'Codec: The algorithm used to compress/decompress video. H.264 (AVC): universal support, high compatibility. H.265 (HEVC): 50% better compression than H.264 but requires licensing. AV1: open source, best compression, slowest encoding.',
            'Container: The file format that wraps encoded video + audio + metadata. MP4: most compatible. WebM: open source, Chrome-native. TS (MPEG-TS): used for live streaming segments.',
            'For streaming: Transcode to H.264 video in an MP4/TS container for maximum compatibility.',
          ],
        },
        { type: 'heading2', text: 'Adaptive Bitrate Streaming (ABR)' },
        {
          type: 'paragraph',
          text: "Instead of streaming one fixed-quality video file, split the video into 2-10 second segments at multiple quality levels. The player monitors the user's download speed and dynamically switches quality between segments. If the user's connection slows down, the player switches to a lower quality (smaller file size). When connection improves, switches back to higher quality.",
        },
        { type: 'heading2', text: 'HLS (HTTP Live Streaming)' },
        {
          type: 'paragraph',
          text: "Apple's streaming protocol, now the industry standard. An HLS manifest (M3U8 file) lists all quality variants and their segment URLs. Each variant has its own playlist of segment URLs. The player downloads the manifest, picks the best quality level, and downloads segments on demand.",
        },
        {
          type: 'code',
          lang: 'text',
          code: `# Master Playlist (index.m3u8)
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=640x360
360p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720
720p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/playlist.m3u8

# Per-quality playlist (720p/playlist.m3u8)
#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-VERSION:3
#EXTINF:6.0,
seg_001.ts
#EXTINF:6.0,
seg_002.ts ...`,
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Upload & Processing Pipeline' },
        {
          type: 'numbered',
          items: [
            'Creator uploads raw video file to Upload Service (chunked, presigned URL to Object Storage).',
            'Upload Service publishes "video_uploaded" event to Kafka.',
            'Transcoding Orchestrator consumes event, creates transcoding jobs for each resolution.',
            'Transcoding Workers (FFmpeg-based, GPU-accelerated) encode the video into segments at each quality level.',
            'Encoded segments uploaded to Object Storage (S3 equivalent).',
            'CDN automatically caches segments as they are requested.',
            'Metadata Service updates video status to "ready" in Video DB.',
            'Creator notified via push notification.',
          ],
        },
        { type: 'heading2', text: 'Streaming Architecture' },
        {
          type: 'bullets',
          items: [
            'Viewer requests video page → Metadata Service returns video info + master playlist URL (pointing to CDN).',
            'Player fetches master playlist from CDN → gets list of quality variants.',
            'Player selects quality based on network speed, downloads segments from CDN.',
            'CDN serves segments from edge cache. Cache miss: CDN fetches from Object Storage (origin).',
            'Player monitors download speed. If segment takes too long, next segment is fetched at lower quality.',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Transcoding at Scale' },
        {
          type: 'paragraph',
          text: 'Transcoding is CPU-intensive. For a 1-hour 4K video at 5M videos/day, you need massive parallel processing.',
        },
        {
          type: 'bullets',
          items: [
            'Parallelism at the video level: Multiple workers each transcoding a different video.',
            'Parallelism within a video: Split the raw video into independent chunks (GOP-aligned — Group of Pictures). Transcode each chunk in parallel on different workers. Reassemble. A 1-hour video can be transcoded in 10 minutes instead of 1 hour.',
            'Resolution parallelism: Transcode 360p, 720p, 1080p simultaneously on different workers.',
            'Hardware acceleration: Use GPU-accelerated transcoding (NVENC on NVIDIA GPUs) for 10-40× speedup vs. CPU-only.',
          ],
        },
        { type: 'heading2', text: 'Video Metadata Schema' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE videos (
  video_id       UUID PRIMARY KEY,
  uploader_id    UUID NOT NULL,
  title          VARCHAR(100),
  description    TEXT,
  duration_secs  INT,
  status         VARCHAR(20), -- uploading, processing, ready, failed
  visibility     VARCHAR(10), -- public, unlisted, private
  view_count     BIGINT DEFAULT 0,
  like_count     INT DEFAULT 0,
  master_playlist_url TEXT,
  thumbnail_url  TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);`,
        },
        { type: 'heading2', text: 'View Count at Scale' },
        {
          type: 'paragraph',
          text: '5 billion views/day = 58K increments/second. Direct DB increment is a bottleneck. Solution: buffer view events in Redis (INCR per video per window), flush to DB in batches every 60 seconds. Approximate counts (±minutes of delay) are perfectly acceptable for view counts.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'CDN as the Primary Scaling Mechanism' },
        {
          type: 'paragraph',
          text: 'A video segment is typically 2-8 MB and watched by many viewers. CDN cache hit rates for popular content approach 99%. Almost all video bytes are served from CDN edges — your origin infrastructure handles only cache misses and fresh content. The CDN does the heavy lifting at scale.',
        },
        { type: 'heading2', text: 'Object Storage Scaling' },
        {
          type: 'bullets',
          items: [
            'Object storage (S3-equivalent) scales infinitely — no capacity planning needed.',
            '5M videos × 1 GB average processed size = 5 PB/day. Budget accordingly.',
            'Tiered storage: Videos not watched in 90 days moved to cheaper "cold" storage tier (e.g., S3 Glacier).',
          ],
        },
        { type: 'heading2', text: 'Transcoding Elastic Scaling' },
        {
          type: 'bullets',
          items: [
            'Use a job queue (SQS/Kafka) for transcoding tasks.',
            'Scale workers based on queue depth. Kubernetes Horizontal Pod Autoscaler triggers on queue lag.',
            'Spot/preemptible instances reduce GPU cost by 60-80% for non-time-critical transcoding.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Transcoding Fault Tolerance' },
        {
          type: 'bullets',
          items: [
            'Each transcoding job is idempotent: re-running a job for the same video produces the same output (deterministic encoding settings).',
            'Failed jobs automatically retried up to 3 times with backoff.',
            'If all retries fail: video stays in "processing_failed" status, alert engineering, notify uploader.',
            'Progress checkpointing: for long videos, save progress periodically. On failure, resume from last checkpoint instead of restarting.',
          ],
        },
        { type: 'heading2', text: 'Content Integrity' },
        {
          type: 'bullets',
          items: [
            'Verify checksums at each step: raw upload → after transcoding → after CDN delivery.',
            'Play-test sampled videos automatically after transcoding (automated QA pipeline).',
            'A/B test encoding quality settings to balance quality vs. file size.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Startup Latency Optimization' },
        {
          type: 'bullets',
          items: [
            'Pre-load the first few segments to CDN edge closest to the viewer as soon as the video page is loaded.',
            'Start playback at the lowest quality level immediately, then switch to higher quality as bandwidth is confirmed.',
            'Pre-fetch the next segment before the current one finishes playing — player always has a buffer.',
          ],
        },
        { type: 'heading2', text: 'Thumbnail Optimization' },
        {
          type: 'bullets',
          items: [
            'Generate multiple thumbnail candidates from different time points during transcoding.',
            'Store thumbnails as WebP format (30% smaller than JPEG with same quality).',
            'Serve thumbnails via CDN with long cache TTL (thumbnails rarely change).',
            'Implement lazy loading — thumbnails outside the viewport are not loaded until scrolled into view.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'HLS vs. DASH' },
        {
          type: 'bullets',
          items: [
            'HLS: Developed by Apple, native support on iOS/Safari. Segment size default: 6 seconds. More widely supported.',
            'DASH (MPEG-DASH): Open standard, supported by most browsers (except Safari). More flexible (different segment sizes, better adaptation algorithms).',
            'Industry practice: Support both. Use HLS for Apple devices, DASH for others.',
          ],
        },
        { type: 'heading2', text: 'Upload to Server vs. Direct Upload to Storage' },
        {
          type: 'bullets',
          items: [
            'Upload via server: Server can validate content (virus scan, format check) before storing. But: server bandwidth is a bottleneck for large video files.',
            'Direct upload to storage: Bypasses server bandwidth. But: harder to intercept for validation. Post-upload validation via async job.',
            'For video uploads: direct upload is necessary for performance. Post-upload validation in the processing pipeline.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Content Moderation' },
        {
          type: 'bullets',
          items: [
            'Run automated content classifiers during transcoding pipeline (violence, adult content, copyright).',
            'Hash-based detection: compute perceptual hash of video frames, compare against database of prohibited content.',
            'Human review queue for flagged content.',
            'Copyright: Content ID system fingerprints videos and matches against a database of copyrighted content.',
          ],
        },
        { type: 'heading2', text: 'Cost Management' },
        {
          type: 'bullets',
          items: [
            'Egress cost: CDN egress is the largest cost. Negotiate CDN contracts carefully.',
            'Transcoding cost: GPU instances are expensive. Use spot instances and optimize encoding settings.',
            'Storage cost: Delete original raw uploads after successful transcoding. Tier old video storage.',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'How would you design the video upload and processing pipeline?',
            'Explain adaptive bitrate streaming.',
            'How would you scale to serve 5 billion video views per day?',
            'How do you handle view count at scale?',
            'How do you reduce video start latency to < 2 seconds?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Processing pipeline: upload → Kafka → transcoding workers → object storage → CDN.',
            'Parallel transcoding within a single video (GOP-aligned chunks) for fast processing.',
            'CDN is the scalability answer for video delivery — almost all bytes served from edge.',
            'Approximate view counts with Redis buffering + batch DB updates.',
            'Adaptive bitrate ensures good experience for all network conditions.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Video systems are complex. Scope carefully in interviews — focus on upload flow and streaming architecture. Do not try to cover recommendations, comments, and social features in the same interview session.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 9 — Ride-Sharing / Location Tracking (Uber-like)
// ─────────────────────────────────────────────────────────────────────────────
const rideSharing: SystemDesignSystem = {
  id: 'ride-sharing',
  title: 'Ride-Sharing / Location Tracking',
  icon: 'ti-map-pin',
  color: '#0891b2',
  bg: '#e0f2fe',
  accentGlow: 'rgba(8,145,178,0.15)',
  difficulty: 'Advanced',
  tagline:
    'Geospatial indexing, real-time matching, WebSockets, and CQRS for high-throughput location updates.',
  tags: ['Geohash', 'Quadtree', 'CQRS', 'WebSockets', 'Real-time Matching'],
  estimatedTime: '65 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: "A ride-sharing platform like Uber or Lyft. Riders request rides and are matched with nearby available drivers. Drivers and riders see each other's real-time location. The system handles trip lifecycle from request through payment.",
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Riders can request a ride, specifying pickup and dropoff locations.',
            'The system matches the rider with the nearest available driver.',
            "Drivers and riders see each other's real-time location during matching and the trip.",
            'Trip fare is estimated before booking and charged after trip.',
            'Trip history is accessible to both drivers and riders.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '1 million drivers, 5 million riders globally.',
            '200,000 concurrent trips at peak.',
            'Driver location updates: every 4 seconds while active.',
            'Matching latency: < 2 seconds (find nearest driver).',
            'Location update throughput: 200K drivers × 1 update/4sec = 50K location updates/second.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Geospatial Indexing — Geohash' },
        {
          type: 'paragraph',
          text: 'A geohash encodes a geographic coordinate (latitude, longitude) into a short alphanumeric string. Nearby locations share the same geohash prefix. Precision depends on string length: 4 chars = ~40km × 20km, 6 chars = ~1.2km × 0.6km, 8 chars = ~38m × 19m.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `Location: Manhattan, NYC (40.7580° N, 73.9855° W)
Geohash 4 chars: "dr5r"  → 40km² cell
Geohash 6 chars: "dr5ru7" → 0.6km² cell (good for driver search)
Geohash 8 chars: "dr5ru77s" → 0.001km² cell (very precise)

Nearby search: Find all drivers with geohash starting with "dr5ru7"
→ All drivers within ~600m of the user
→ Also check 8 neighboring geohash cells (to avoid border effects)`,
        },
        { type: 'heading2', text: 'Geospatial Indexing — Quadtree' },
        {
          type: 'paragraph',
          text: 'A quadtree recursively divides a 2D space into four quadrants. Each leaf node represents a geographic cell. Quadtrees are dynamically balanced — dense areas are subdivided into smaller cells, sparse areas remain in larger cells. Better than geohash for variable-density data (more drivers in city centers).',
        },
        { type: 'heading2', text: 'CQRS (Command Query Responsibility Segregation)' },
        {
          type: 'paragraph',
          text: 'CQRS separates the write side (commands — update driver location) from the read side (queries — find nearby drivers). The write side optimizes for throughput (50K updates/second). The read side maintains a separate, optimized data structure (geospatial index) for fast proximity queries. They are kept in sync asynchronously.',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Components' },
        {
          type: 'bullets',
          items: [
            'Location Service: Receives high-frequency driver location updates (50K/sec). Writes to Location Store and publishes to Kafka.',
            'Location Store: Redis geospatial index. Stores current driver locations. Supports radius search in O(N+log M) where N = results, M = total drivers.',
            'Matching Service: When a rider requests a ride, queries Location Store for nearby available drivers, applies matching algorithm, sends trip offer.',
            'Trip Service: Manages trip lifecycle (requested, matched, in-progress, completed). Stored in PostgreSQL.',
            'WebSocket Gateway: Maintains persistent connections with drivers and riders. Pushes real-time location updates and trip status changes.',
            'Driver App / Rider App: Mobile clients communicating via WebSocket for real-time and REST for non-real-time operations.',
            'Pricing Service: Calculates fare estimate and surge pricing based on supply/demand in each geographic area.',
            'Kafka: Event bus decoupling location updates from consumers (matching service, WebSocket gateway, analytics).',
          ],
        },
        { type: 'heading2', text: 'Ride Request Flow' },
        {
          type: 'numbered',
          items: [
            'Rider opens app, sees nearby drivers on map (Location Service + WebSocket push).',
            'Rider requests ride: POST /api/trips {pickupLocation, dropoffLocation}',
            'Matching Service finds N nearest available drivers using Redis geo-search.',
            'Sends ride offer (via WebSocket) to top 3 candidates simultaneously (drivers have 15s to accept).',
            'First driver to accept is matched. Others are notified of cancellation.',
            "Both driver and rider see each other's real-time location via WebSocket.",
            'Trip completes → Fare calculated → Payment charged → Trip stored in DB.',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Redis Geospatial Index' },
        {
          type: 'code',
          lang: 'text',
          code: `# Store driver location
GEOADD drivers_available {lng} {lat} {driver_id}

# Find available drivers within 5km of rider
GEORADIUSBYMEMBER drivers_available {rider_lat} {rider_lng} 5 km ASC COUNT 10

# Response: [driverId1 (0.8km), driverId2 (1.2km), ...]
# O(N+log M) — very fast even with 100K drivers`,
        },
        { type: 'heading2', text: 'Driver Location Update Flow (CQRS Write Side)' },
        {
          type: 'numbered',
          items: [
            'Driver app sends GPS coordinates every 4 seconds via WebSocket.',
            'WebSocket Gateway forwards to Location Service.',
            'Location Service writes to Redis (GEOADD — overwrites previous location).',
            'Location Service publishes event to Kafka: {driverId, lat, lng, timestamp}.',
            'Kafka consumers: (1) WebSocket Gateway pushes location to matched rider. (2) Analytics records driver path.',
          ],
        },
        { type: 'heading2', text: 'Surge Pricing (Dynamic Pricing)' },
        {
          type: 'paragraph',
          text: 'Surge pricing increases fares when demand exceeds supply in a geographic area. Implementation: count ride requests and available drivers per geohash cell in a 5-minute sliding window. Surge multiplier = f(demand / supply). Cached in Redis per geohash cell, updated every 30 seconds.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Location Update Scaling (50K/sec)' },
        {
          type: 'bullets',
          items: [
            'Redis handles 100K+ operations/second on a single node. 50K GEOADD operations/second is within capacity.',
            "Redis Cluster: Shard by geographic region (North America, Europe, Asia). Each region's drivers are a separate Redis cluster.",
            'Location Service scales horizontally — stateless workers consuming location updates via WebSocket.',
          ],
        },
        { type: 'heading2', text: 'WebSocket Connection Scaling' },
        {
          type: 'bullets',
          items: [
            '200K active trips × 2 connections (driver + rider) = 400K concurrent WebSocket connections.',
            'Plus offline drivers waiting for rides: 1M total connections.',
            'Each WebSocket server: ~50K connections. Need 20 servers.',
            'Service registry (like in chat system): Track which WebSocket server each driver/rider is connected to.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Driver Availability Consistency' },
        {
          type: 'paragraph',
          text: 'Redis is the source of truth for driver availability. If a driver accepts a ride, they must be immediately removed from the available pool (ZREM from geo index). If not, another rider might be matched to the same driver. Use Redis atomic operations (ZADD + ZREM in a Lua script) to prevent race conditions.',
        },
        { type: 'heading2', text: 'Trip State Machine' },
        {
          type: 'paragraph',
          text: 'Trips go through well-defined states: REQUESTED → MATCHED → DRIVER_EN_ROUTE → TRIP_IN_PROGRESS → COMPLETED (or CANCELLED at various stages). Each state transition is persisted to PostgreSQL before confirming to the client. If the system crashes during a state transition, it can recover from the last committed state.',
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Matching Optimization' },
        {
          type: 'paragraph',
          text: 'Finding the nearest driver must complete in < 500ms. Redis GEORADIUS with COUNT 10 returns the 10 nearest drivers in ~1ms. The matching algorithm considers: distance, driver rating, driver type (UberX, UberXL), estimated arrival time. ETA calculation uses precomputed routing data (not live traffic for the matching step).',
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Geohash vs. Quadtree vs. Redis Geo' },
        {
          type: 'bullets',
          items: [
            'Geohash: Simple prefix-based search. Known edge effects at cell boundaries (need to check 9 cells). Fixed cell size.',
            'Quadtree: Variable cell size adapts to density. More complex implementation.',
            'Redis Geo: Built-in geospatial commands using geohash internally. Easiest to use, production-ready. Best choice for most use cases.',
            'Google S2 / Uber H3: Advanced geospatial indexing for complex routing. Used when you need hierarchical spatial analytics.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Privacy' },
        {
          type: 'bullets',
          items: [
            'Anonymize driver location when not on a trip (show approximate area, not exact position).',
            'Delete precise location history after trip completion (keep only start/end points for support).',
            'Comply with local regulations (GDPR, CCPA) for location data storage and retention.',
          ],
        },
        { type: 'heading2', text: 'ETA and Routing' },
        {
          type: 'paragraph',
          text: "Real-time ETA requires live traffic data, road conditions, and route optimization. For a full implementation, integrate with a routing engine (OSRM, Google Maps API, or Uber's own routing infrastructure). Pre-compute ETA for common routes and update based on real-time traffic events.",
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'How would you store and query driver locations efficiently?',
            'How do you match a rider to the nearest available driver?',
            'How do you handle the case where a driver is matched to multiple riders simultaneously?',
            'How do you push real-time location updates to both driver and rider apps?',
            'How would you implement surge pricing?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Redis Geo for location storage and radius search — O(N+log M).',
            'CQRS: separate high-throughput write path (location updates) from read path (proximity queries).',
            'Atomic driver state change: GEOADD + ZREM in a Lua script prevents double-booking.',
            'WebSocket for real-time location push — same pattern as chat system.',
            'Event sourcing for trip state — every state change is a persistent event.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The key insight in ride-sharing is the geospatial challenge. Knowing Redis GEO commands, geohash edge effects, and how to prevent double-matching (atomic Redis operations) sets you apart from candidates who only discuss high-level concepts.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 10 — Payment Processing System
// ─────────────────────────────────────────────────────────────────────────────
const paymentSystem: SystemDesignSystem = {
  id: 'payment-system',
  title: 'Payment Processing System',
  icon: 'ti-credit-card',
  color: '#7c3aed',
  bg: '#ede9fe',
  accentGlow: 'rgba(124,58,237,0.15)',
  difficulty: 'Advanced',
  tagline:
    'ACID transactions, Saga pattern, distributed locks, idempotency keys, and PCI DSS compliance.',
  tags: ['ACID', 'Saga Pattern', 'Idempotency', 'Distributed Transactions', 'PCI DSS'],
  estimatedTime: '70 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A payment processing system like Stripe or PayPal. Handles charge processing, refunds, payouts, and transaction history. Integrates with payment networks (Visa, Mastercard), banks, and external payment providers. Correctness is paramount — financial data must be exactly right.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Process payments (charge a card or bank account).',
            'Support refunds (full and partial).',
            'Payout to sellers/merchants.',
            'Transaction history and reporting.',
            'Support multiple payment methods: credit card, bank transfer, digital wallets.',
            'Multi-currency support.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '1 million transactions per day.',
            'P99 payment latency < 3 seconds (dependent on bank/network response).',
            'Zero data loss — every transaction must be recorded, even if processing fails.',
            'Exactly-once payment processing — a user must never be charged twice for the same intent.',
            'Compliance: PCI DSS (Payment Card Industry Data Security Standard).',
            'Audit log: every action on every transaction must be logged immutably.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'ACID Transactions' },
        {
          type: 'bullets',
          items: [
            'Atomicity: A transaction either fully succeeds or fully fails. No partial state. "All or nothing."',
            'Consistency: The database moves from one valid state to another. Business rules are never violated.',
            "Isolation: Concurrent transactions do not see each other's intermediate state. As if they ran sequentially.",
            'Durability: Once committed, the transaction is permanent. A power failure cannot undo a committed payment.',
            'ACID is guaranteed by traditional RDBMS (PostgreSQL, MySQL). NoSQL databases typically sacrifice some ACID properties for scalability.',
          ],
        },
        { type: 'heading2', text: 'Idempotency Keys' },
        {
          type: 'paragraph',
          text: 'The most critical concept in payment systems. If a payment request times out, was it processed? The client does not know. Without idempotency, retrying the request charges the customer twice.',
        },
        {
          type: 'paragraph',
          text: 'Solution: The client generates a unique idempotency_key for each payment intent. The first request with this key is processed normally. Subsequent requests with the same key return the cached result without reprocessing. The key must be stored durably in the database alongside the transaction.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Client generates a unique key per payment attempt
const idempotencyKey = crypto.randomUUID();

// First attempt
await stripe.charges.create({
  amount: 2000,        // $20.00
  currency: 'usd',
  source: 'tok_xxxx',
  idempotency_key: idempotencyKey
});

// Network timeout — retry with SAME key
await stripe.charges.create({
  amount: 2000,
  currency: 'usd',
  source: 'tok_xxxx',
  idempotency_key: idempotencyKey  // Server returns cached result, no double charge
});`,
        },
        { type: 'heading2', text: 'Distributed Transactions — The 2-Phase Commit (2PC) Problem' },
        {
          type: 'paragraph',
          text: 'In a distributed system, a payment involves multiple services (Payment Service, Ledger Service, Notification Service). 2-Phase Commit coordinates these: Phase 1 (Prepare): All participants confirm they can commit. Phase 2 (Commit): All participants commit. Problem: If the coordinator crashes between phases, participants are in an unknown state — stuck. 2PC is blocking and slow.',
        },
        { type: 'heading2', text: 'The Saga Pattern (Solution to 2PC)' },
        {
          type: 'paragraph',
          text: 'A Saga is a sequence of local transactions. Each step has a compensating transaction that undoes it if a later step fails. No distributed lock held — each service commits locally and immediately.',
        },
        {
          type: 'bullets',
          items: [
            'Choreography Saga: Each service publishes events; other services react. Decoupled but hard to track the overall flow.',
            'Orchestration Saga: A central Saga Orchestrator tells each service what to do, tracks state, and triggers compensating transactions on failure. Easier to debug and monitor.',
          ],
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Components' },
        {
          type: 'bullets',
          items: [
            'Payment API Gateway: Entry point. Validates requests, checks idempotency keys, authenticates merchants.',
            'Payment Service: Core business logic. Orchestrates the payment saga.',
            'Ledger Service: Maintains double-entry bookkeeping ledger. Every debit has a matching credit.',
            'Payment Provider Integration Service: Connects to Stripe, Adyen, or directly to card networks (Visa/Mastercard via acquiring bank).',
            'Fraud Detection Service: Real-time ML-based fraud scoring. Blocks suspicious transactions.',
            'Idempotency Store: PostgreSQL table + Redis cache for idempotency key lookup.',
            'Notification Service: Sends payment receipts, failure alerts.',
            'Reconciliation Service: Nightly batch job reconciles internal ledger against bank statements.',
            'Audit Log: Append-only event store recording every action.',
          ],
        },
        { type: 'heading2', text: 'Payment Saga Flow (Success Path)' },
        {
          type: 'numbered',
          items: [
            'POST /api/payments {amount, currency, paymentMethod, idempotency_key}',
            'Check idempotency key — if already processed, return cached result.',
            'Fraud Detection: score the transaction. If high fraud risk, decline immediately.',
            'Reserve funds: call Payment Provider to pre-authorize (hold) the amount.',
            'Record in Ledger: debit customer account, credit escrow.',
            'Capture funds: call Payment Provider to capture the pre-authorized charge.',
            'Update Ledger: move from escrow to merchant account.',
            'Send receipt notification.',
            'Return success response with transaction_id.',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Double-Entry Ledger' },
        {
          type: 'paragraph',
          text: 'Every financial system uses double-entry bookkeeping: every transaction creates two ledger entries — a debit and a credit. The sum of all debits always equals the sum of all credits. This mathematical invariant makes fraud detection and reconciliation possible.',
        },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE ledger_entries (
  entry_id       UUID PRIMARY KEY,
  transaction_id UUID NOT NULL,
  account_id     UUID NOT NULL,
  entry_type     VARCHAR(6) NOT NULL,  -- 'DEBIT' or 'CREDIT'
  amount         NUMERIC(15, 2) NOT NULL,
  currency       CHAR(3) NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Example: $20 payment from customer to merchant
INSERT INTO ledger_entries VALUES
  (uuid(), 'tx_001', 'customer_acct', 'DEBIT',  20.00, 'USD', NOW()),
  (uuid(), 'tx_001', 'merchant_acct', 'CREDIT', 20.00, 'USD', NOW());
  -- Sum of debits == Sum of credits → Balanced ✓`,
        },
        { type: 'heading2', text: 'Idempotency Implementation' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE idempotency_keys (
  idempotency_key VARCHAR(255) PRIMARY KEY,
  response_status INT,
  response_body   JSONB,
  transaction_id  UUID,
  created_at      TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP  -- typically 24 hours
);

-- On request:
-- 1. SELECT * FROM idempotency_keys WHERE idempotency_key = $1
-- 2. If found: return stored response (without reprocessing)
-- 3. If not found: process request, then INSERT into idempotency_keys`,
        },
        { type: 'heading2', text: 'Outbox Pattern for Reliable Event Publishing' },
        {
          type: 'paragraph',
          text: 'The payment service must both commit to the database AND publish an event to Kafka. What if it commits to DB but crashes before publishing? Event is lost. Solution: Outbox Pattern. Write the event to an "outbox" table in the SAME database transaction. A separate "outbox processor" reads from the outbox table and publishes to Kafka, then marks as published. Atomic with the database write; separate from Kafka write.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Database Scaling' },
        {
          type: 'bullets',
          items: [
            '1M transactions/day = ~12 transactions/second. A single PostgreSQL instance handles this easily (up to 10K TPS).',
            'Shard by merchant_id for multi-tenant systems. Each shard handles a subset of merchants.',
            'Read replicas for reporting queries. Never run heavy analytics on the primary.',
            'Archive old transactions (> 7 years) to cheaper storage for compliance — but keep ledger entries immutable and accessible.',
          ],
        },
        { type: 'heading2', text: 'Throughput Scaling' },
        {
          type: 'bullets',
          items: [
            'The bottleneck is usually the external payment provider API (Stripe/bank), not your infrastructure.',
            'Use connection pooling (PgBouncer) to maximize database throughput.',
            'Async payment processing: Return a pending status immediately, process asynchronously, webhook/notify when complete.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Saga Compensation on Failure' },
        {
          type: 'bullets',
          items: [
            'If Capture fails after Reserve: Saga orchestrator triggers compensating transaction — release the pre-authorization.',
            "If Ledger update fails after Capture: This is critical — money has left the customer's account but not reached the merchant. Saga must retry the ledger update (idempotent) or flag for manual intervention.",
            'Every compensating transaction must itself be idempotent — the saga may retry it multiple times.',
          ],
        },
        { type: 'heading2', text: 'Reconciliation' },
        {
          type: 'paragraph',
          text: "Nightly reconciliation compares your internal ledger against the bank's/provider's statement. Any discrepancy triggers an alert for manual investigation. Reconciliation catches bugs, fraud, and infrastructure failures that slipped through. It is the safety net that guarantees long-term financial integrity.",
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Fraud Detection Latency' },
        {
          type: 'paragraph',
          text: 'Fraud scoring must complete in < 100ms to not add significant latency to the payment flow. Use a lightweight ML model (gradient boosted trees, not neural networks) for real-time scoring. Pre-compute user risk profiles in batch. The real-time scorer uses pre-computed features + transaction-specific features.',
        },
        { type: 'heading2', text: 'Caching Idempotency Keys' },
        {
          type: 'paragraph',
          text: 'Store idempotency keys in both Redis (fast lookup) and PostgreSQL (durable). First check Redis — O(1) lookup in < 1ms. If not in Redis, check PostgreSQL. This two-tier approach handles the common case (no duplicate) with minimal overhead.',
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Synchronous vs. Asynchronous Payment Processing' },
        {
          type: 'bullets',
          items: [
            'Synchronous: User waits for the full payment confirmation (charge + ledger + notification). Simple UX ("Payment confirmed" immediately). Latency depends on external providers (~2-5 seconds).',
            'Asynchronous: Return "payment pending" immediately. Process in background. Webhook/notification when complete. Better throughput, handles provider slowness. More complex UX.',
            'Recommendation: Synchronous for user-facing payments (e-commerce). Asynchronous for bulk payouts and B2B payments.',
          ],
        },
        { type: 'heading2', text: 'Consistency vs. Availability' },
        {
          type: 'paragraph',
          text: 'Payment systems must be CP (Consistent + Partition Tolerant). During a network partition, it is better to reject payments (return an error) than to risk double-charging or inconsistent ledger state. Never sacrifice consistency for availability in financial systems.',
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'PCI DSS Compliance' },
        {
          type: 'bullets',
          items: [
            'Never store raw card numbers (PANs) in your database. Use tokenization — store a token that references the card in a PCI-compliant vault.',
            'Encrypt sensitive data at rest (AES-256) and in transit (TLS 1.2+).',
            'Access control: Only authorized services can access payment data. Strict RBAC.',
            'Annual PCI DSS audit by a Qualified Security Assessor (QSA).',
            'Network segmentation: Payment systems in isolated network segment, separate from application servers.',
          ],
        },
        { type: 'heading2', text: 'Audit Logging' },
        {
          type: 'bullets',
          items: [
            'Every action on every transaction must be logged: who did what, when, from which IP.',
            'Audit logs are append-only — never modified or deleted.',
            'Stored in a separate system from the main database, with separate access controls.',
            'Retained for 7+ years (regulatory requirement in most jurisdictions).',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'How do you prevent a user from being charged twice for the same payment?',
            'How do you handle a timeout from the payment provider — do you retry?',
            'Explain the Saga pattern and when you would use it over 2-Phase Commit.',
            'How do you handle a partial failure in a distributed payment flow?',
            'How do you ensure the integrity of financial data across services?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Idempotency keys are the most important concept — explain them clearly and concisely.',
            'Double-entry ledger: every debit has a credit — mathematical invariant for integrity.',
            'Saga pattern over 2PC: no distributed lock, compensating transactions on failure.',
            'Outbox pattern: atomic event publishing with database transaction.',
            'CP over AP: always choose consistency for financial data.',
            'Reconciliation: the safety net that catches everything else.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Payment systems are the most nuanced system design topic. Interviewers at FAANG and fintech companies expect you to know idempotency keys, double-entry ledger, and the Saga pattern. These three concepts, explained clearly, will set you apart in any senior/staff engineer payment system interview.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────
export const SYSTEM_DESIGN_SYSTEMS: SystemDesignSystem[] = [
  urlShortener,
  rateLimiter,
  distributedLoadBalancer,
  distributedCache,
  chatSystem,
  notificationSystem,
  fileStorage,
  newsFeed,
  videoStreaming,
  rideSharing,
  paymentSystem,
];
