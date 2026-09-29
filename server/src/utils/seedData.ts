import { Incident } from '../models/Incident.js';
import { MemoryEntry } from '../models/MemoryEntry.js';
import { Investigation } from '../models/Investigation.js';
import { hindsightService } from '../services/hindsight.service.js';
import { logger } from './logger.js';

export interface SeedIncidentData {
  incidentId: string;
  title: string;
  service: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  environment: 'Production' | 'Staging' | 'Development';
  errorMessage: string;
  logs: string;
  tags: string[];
  status: 'Resolved' | 'Investigating' | 'New';
  resolution?: {
    confirmedRootCause: string;
    resolutionSteps: string;
    worked: boolean;
    notes?: string;
    lessonsLearned?: string;
    failedApproaches?: string[];
  };
}

export const REALISTIC_INCIDENTS: SeedIncidentData[] = [
  {
    incidentId: 'INC-2026-0001',
    title: 'Payment API connection pool exhaustion under flash sale load',
    service: 'Payment-API',
    severity: 'Critical',
    environment: 'Production',
    errorMessage: 'ConnectionPoolTimeoutException: Timeout waiting for idle connection from pool [pool-size=20, active=20, pending=142]',
    logs: `2026-09-20T14:22:01.412Z [ERROR] [org.postgresql.Driver] Connection checkout timed out after 30000ms
  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:227)
  at com.payments.dao.TransactionRepository.recordAuthorization(TransactionRepository.java:88)
  at com.payments.service.PaymentProcessor.charge(PaymentProcessor.java:142)
  at com.payments.controller.PaymentController.process(PaymentController.java:54)`,
    tags: ['database', 'connection-pool', 'hikari', 'postgresql', 'payments'],
    status: 'Resolved',
    resolution: {
      confirmedRootCause: 'HikariCP maximumPoolSize was capped at 20 while Tomcat worker thread count was increased to 200 during previous deployment, causing thread starvation and pool lockups.',
      resolutionSteps: '1. Increased maxPoolSize from 20 to 75 in payment-service helm values.\n2. Reduced connection timeout from 30s to 5s to fail-fast.\n3. Performed rolling restart of payment pods.\n4. Verified DB metrics: active connections stabilized at 45.',
      worked: true,
      notes: 'PostgreSQL instance max_connections is 500 across 3 replicas, so 75 per pod (x3 pods = 225) is well within safety thresholds.',
      lessonsLearned: 'Always align thread pool capacity with database connection pool limits during capacity planning.',
      failedApproaches: [
        'Attempted simply restarting pods without increasing pool size; connections immediately saturated again within 90 seconds.',
      ],
    },
  },
  {
    incidentId: 'INC-2026-0002',
    title: 'User Service 504 Gateway Timeout following v2.4.1 deployment',
    service: 'User-Service',
    severity: 'High',
    environment: 'Production',
    errorMessage: 'HTTP 504 Gateway Timeout: Upstream request to /api/v1/users/profile timed out after 60000ms',
    logs: `2026-09-21T09:15:44.201Z [WARN] [ingress-nginx] 504 Gateway Timeout upstream: "http://10.244.3.112:8080"
2026-09-21T09:15:45.002Z [ERROR] [user-service] ThreadPoolExecutor queue full [capacity=500, active=64, rejected=1]
  at java.util.concurrent.ThreadPoolExecutor$AbortPolicy.rejectedExecution`,
    tags: ['deployment', 'latency', 'thread-pool', 'timeout', 'nginx'],
    status: 'Resolved',
    resolution: {
      confirmedRootCause: 'Unindexed query on user_preferences table introduced in v2.4.1 migration caused sequential table scan on 4M rows for every profile fetch.',
      resolutionSteps: '1. Ran EXPLAIN ANALYZE on query: SELECT * FROM user_preferences WHERE user_id = $1.\n2. Created concurrent index: CREATE INDEX CONCURRENTLY idx_user_prefs_user_id ON user_preferences(user_id);\n3. Query time dropped from 14.2s to 1.8ms.',
      worked: true,
      notes: 'Index build took 42 seconds in background with zero table lock.',
      lessonsLearned: 'Mandate database query plan review in PR pipeline before merging schema changes.',
      failedApproaches: [
        'Attempted increasing Nginx proxy_read_timeout to 120s; this only accumulated more stalled connections.',
      ],
    },
  },
  {
    incidentId: 'INC-2026-0003',
    title: 'Redis session store cluster connection failure and failover flap',
    service: 'Session-Gateway',
    severity: 'Critical',
    environment: 'Production',
    errorMessage: 'RedisConnectionException: Unable to connect to redis-cluster-node-0.redis.internal:6379 (Connection refused)',
    logs: `2026-09-22T18:02:11.901Z [FATAL] [io.lettuce.core.RedisClient] Connection refused: /10.244.1.88:6379
  at io.lettuce.core.protocol.ConnectionWatchdog.run(ConnectionWatchdog.java:140)
  at io.netty.util.HashedWheelTimer$HashedWheelTimeout.expire(HashedWheelTimer.java:672)`,
    tags: ['redis', 'cache', 'session', 'cluster-failover'],
    status: 'Resolved',
    resolution: {
      confirmedRootCause: 'Redis Sentinel failover occurred but client driver lacked auto-reconnect topology refresh enabled, causing client to remain pinned to stale master IP.',
      resolutionSteps: '1. Enabled topologyRefreshOptions in Lettuce client config with periodic refresh of 30s.\n2. Enabled adaptiveTopologyRefresh on DISCONNECTED events.\n3. Redeployed Session-Gateway.',
      worked: true,
      notes: 'Clients immediately discover new master upon failover without manual pod recycling.',
      lessonsLearned: 'Redis cluster drivers must always be configured with dynamic topology refresh.',
      failedApproaches: [],
    },
  },
  {
    incidentId: 'INC-2026-0004',
    title: 'Order Processing Service CPU pegged at 100% due to regex catastrophic backtracking',
    service: 'Order-Service',
    severity: 'High',
    environment: 'Production',
    errorMessage: 'ProcessCpuThresholdExceeded: Container CPU utilization 99.8% for > 5 minutes',
    logs: `2026-09-23T11:40:12.822Z [WARN] [k8s-node-worker-4] Pod order-service-78bfb64d84-x9qwp throttling CPU
2026-09-23T11:41:00.119Z [ERROR] [order-service] EventLoopBlocked: Event loop delay exceeded threshold (4820ms)`,
    tags: ['cpu', 'performance', 'regex', 'event-loop'],
    status: 'Resolved',
    resolution: {
      confirmedRootCause: 'Regex vulnerability in coupon code validation regex ^([a-zA-Z0-9]+)+$ caused catastrophic backtracking when users entered strings with trailing spaces.',
      resolutionSteps: '1. Replaced vulnerable regex with linear scanner and atomic group ^[a-zA-Z0-9]{3,20}$.\n2. Deployed hotfix patch release v1.8.3.\n3. CPU immediately returned to normal baseline (8-12%).',
      worked: true,
      notes: 'Identified culprit using pprof and Node.js profiler tick samples.',
      lessonsLearned: 'Use safe regex lint rules (eslint-plugin-clean-regex) to prevent exponential backtracking.',
      failedApproaches: [
        'Doubled container CPU limit from 1000m to 2000m; both cores were immediately consumed at 100%.',
      ],
    },
  },
  {
    incidentId: 'INC-2026-0005',
    title: 'Auth Service token verification failure due to expired JWKS cache',
    service: 'Auth-Service',
    severity: 'Critical',
    environment: 'Production',
    errorMessage: 'JsonWebTokenError: Unable to find key matching kid "key-2026-q3" in cached jwks keystore',
    logs: `2026-09-24T03:00:15.551Z [ERROR] [auth-service] JWT Verification Failed: Unknown key ID
  at node_modules/jwks-rsa/lib/JwksClient.js:104:15
  at async verifyAuthHeader (src/middleware/auth.ts:42:22)`,
    tags: ['auth', 'jwt', 'security', 'jwks', 'cache'],
    status: 'Resolved',
    resolution: {
      confirmedRootCause: 'Identity provider rotated RSA keys at midnight, but Auth-Service had configured jwks-rsa with jwksRequestsPerMinute: 2 and rateLimit: true with a 24-hour cache TTL.',
      resolutionSteps: '1. Updated jwks-rsa config to allow automatic on-demand cache bypass when an unknown kid is presented (rate limited to 10/min).\n2. Set cache TTL to 1 hour.\n3. Flushed in-memory JWKS cache across Auth-Service pods.',
      worked: true,
      notes: 'Identity provider key rotations now handle cleanly within 1 request cycle.',
      lessonsLearned: 'JWKS clients must always implement lazy fetching for unrecognised kid headers.',
      failedApproaches: [],
    },
  },
  {
    incidentId: 'INC-2026-0006',
    title: 'Checkout Service payment webhook timeout caused by external gateway TLS renegotiation',
    service: 'Checkout-Service',
    severity: 'Medium',
    environment: 'Production',
    errorMessage: 'FetchError: request to https://api.stripe-gateway.internal/v1/webhook failed, reason: read ECONNRESET',
    logs: `2026-09-25T08:12:33.102Z [ERROR] [checkout-service] Payment webhook failed to deliver
  code: 'ECONNRESET', errno: -4077, syscall: 'read'`,
    tags: ['checkout', 'webhook', 'tls', 'network'],
    status: 'Resolved',
    resolution: {
      confirmedRootCause: 'Outbound NAT gateway connection state timed out after 350s of idle keep-alive, resetting socket without FIN handshake.',
      resolutionSteps: '1. Configured HTTP agent with keepAlive: true and maxSockets: 100.\n2. Set keepAliveMsecs: 60000 and socket timeout: 30000ms.\n3. Added retry mechanism with exponential backoff on ECONNRESET.',
      worked: true,
      notes: 'Outbound webhook drop rate fell from 4.2% to 0.001%.',
      lessonsLearned: 'Always set explicit socket keep-alive and connect timeouts below cloud NAT timeout limits.',
      failedApproaches: [],
    },
  },
  {
    incidentId: 'INC-2026-0007',
    title: 'Failed database migration locking inventory items table',
    service: 'Inventory-Service',
    severity: 'High',
    environment: 'Production',
    errorMessage: 'QueryFailedError: deadlock detected while executing ALTER TABLE inventory_items ADD COLUMN reserved_count INT DEFAULT 0',
    logs: `2026-09-26T16:05:01.332Z [ERROR] [typeorm] migration failed: 1727366700-AddReservedCount
  ERROR: deadlock detected
  DETAIL: Process 18420 waits for AccessExclusiveLock on relation 16428 of database 16384; blocked by process 18399.`,
    tags: ['migration', 'database', 'lock', 'inventory'],
    status: 'Resolved',
    resolution: {
      confirmedRootCause: 'Migration attempted to acquire AccessExclusiveLock during peak checkout traffic while high-frequency read/write transactions were open on inventory_items.',
      resolutionSteps: '1. Set lock_timeout = 2000 in migration script to avoid holding locks in queue.\n2. Ran migration with NULL default: ALTER TABLE inventory_items ADD COLUMN reserved_count INT;\n3. Backfilled existing records in batches of 1000 with SLEEP(0.05) between chunks.',
      worked: true,
      notes: 'Zero downtime achieved. Batch update took 3 minutes without blocking any live transactions.',
      lessonsLearned: 'Never add columns with non-null defaults to high-volume tables without batching.',
      failedApproaches: [],
    },
  },
  {
    incidentId: 'INC-2026-0008',
    title: 'Memory leak in Notification Worker caused by unbounded unhandled promise queue',
    service: 'Notification-Worker',
    severity: 'Medium',
    environment: 'Production',
    errorMessage: 'FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory',
    logs: `2026-09-27T02:14:09.112Z [FATAL] [node] <--- Last few GCs --->
  [82:0x55dc90a88000] 142100 ms: Mark-Compact (reduce) 2047.2 (2055.4) -> 2046.1 (2056.2) MB, 1820.4 ms
  <--- JS stacktrace --->
  FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`,
    tags: ['memory-leak', 'worker', 'heap', 'nodejs', 'notifications'],
    status: 'Resolved',
    resolution: {
      confirmedRootCause: 'Email notification retry queue retained closures referencing the entire raw SMTP response payload in an array without eviction policy.',
      resolutionSteps: '1. Replaced in-memory retry array with Redis-backed BullMQ queue.\n2. Added maxHeapSize flag: --max-old-space-size=1536.\n3. Implemented TTL of 4 hours on job result artifacts.',
      worked: true,
      notes: 'Heap memory stabilized flat at 180MB over 48-hour soak test.',
      lessonsLearned: 'Background worker queues must always use persistent external queue brokers rather than unbounded in-process heap arrays.',
      failedApproaches: [],
    },
  },
];

/**
 * Seed database with realistic incidents and ingest them into Hindsight memory
 */
export async function seedIncidentData(forceReset = false): Promise<{
  seededCount: number;
  retainedMemoriesCount: number;
}> {
  logger.info('Starting realistic incident seed process...', { forceReset });

  if (forceReset) {
    logger.info('Clearing existing incidents, investigations, and memory entries...');
    await Incident.deleteMany({});
    await Investigation.deleteMany({});
    await MemoryEntry.deleteMany({});
  }

  let seededCount = 0;
  let retainedMemoriesCount = 0;

  for (const item of REALISTIC_INCIDENTS) {
    const existing = await Incident.findOne({ incidentId: item.incidentId });
    let incident = existing;

    if (!existing) {
      incident = await Incident.create({
        incidentId: item.incidentId,
        title: item.title,
        service: item.service,
        severity: item.severity,
        environment: item.environment,
        errorMessage: item.errorMessage,
        logs: item.logs,
        tags: item.tags,
        status: item.status,
        resolution: item.resolution
          ? {
              ...item.resolution,
              resolvedAt: new Date(Date.now() - (8 - seededCount) * 86400000), // Stagger over past 8 days
              resolvedBy: 'Lead SRE',
            }
          : undefined,
      });
      seededCount++;
    }

    // Ingest into Hindsight memory if incident has confirmed resolution
    if (incident && incident.resolution && incident.resolution.worked) {
      const memoryContent = `[CONFIRMED RESOLUTION] Service: ${incident.service}. Error: ${incident.errorMessage}. Root Cause: ${incident.resolution.confirmedRootCause}. Verified Fix: ${incident.resolution.resolutionSteps}.${incident.resolution.lessonsLearned ? ` Lesson Learned: ${incident.resolution.lessonsLearned}` : ''}`;

      await hindsightService.retainKnowledge({
        incident,
        memoryType: 'confirmed_resolution',
        content: memoryContent,
        metadata: {
          confirmedRootCause: incident.resolution.confirmedRootCause,
          resolutionSteps: incident.resolution.resolutionSteps,
          lessonsLearned: incident.resolution.lessonsLearned,
        },
      });
      retainedMemoriesCount++;

      // Also ingest failed approach if present
      if (incident.resolution.failedApproaches && incident.resolution.failedApproaches.length > 0) {
        for (const failed of incident.resolution.failedApproaches) {
          const failedContent = `[FAILED APPROACH - DO NOT REPEAT] Service: ${incident.service}. Error: ${incident.errorMessage}. Ineffective Attempt: ${failed}.`;
          await hindsightService.retainKnowledge({
            incident,
            memoryType: 'failed_approach',
            content: failedContent,
          });
          retainedMemoriesCount++;
        }
      }
    }
  }

  logger.info(`Seeding finished. Added ${seededCount} incidents, ingested ${retainedMemoriesCount} Hindsight memory entries.`);

  return { seededCount, retainedMemoriesCount };
}
