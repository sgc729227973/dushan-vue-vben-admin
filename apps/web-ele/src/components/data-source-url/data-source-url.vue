<script lang="ts" setup>
import { computed, onMounted, reactive, watch } from 'vue';

import {
  ElCheckbox,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { InfraDbTypeEnum } from '#/utils';

// 定义组件名称
defineOptions({ name: 'DataSourceUrl' });

// 定义组件属性
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

// 定义事件发射
const emit = defineEmits(['update:modelValue']);

// 完整的 RDBMS 数据库支持列表
const RDBMS_DATABASES = {
  // 主流商业数据库
  oracle: {
    name: 'Oracle Database',
    defaultPort: 1521,
    asyncDriver: 'oracledb',
    syncDriver: 'cx_oracle',
  },
  mssql: {
    name: 'Microsoft SQL Server',
    defaultPort: 1433,
    asyncDriver: 'aioodbc',
    syncDriver: 'pyodbc',
  },
  db2: {
    name: 'IBM Db2',
    defaultPort: 50_000,
    asyncDriver: 'aioodbc',
    syncDriver: 'ibm_db',
  },

  // 开源数据库
  postgresql: {
    name: 'PostgreSQL',
    defaultPort: 5432,
    asyncDriver: 'asyncpg',
    syncDriver: 'psycopg2',
  },
  mysql: {
    name: 'MySQL/MariaDB',
    defaultPort: 3306,
    asyncDriver: 'aiomysql',
    syncDriver: 'pymysql',
  },
  sqlite: {
    name: 'SQLite',
    defaultPort: 0,
    asyncDriver: 'aiosqlite',
    syncDriver: 'sqlite3',
  },

  // 国产数据库
  dm: {
    name: '达梦数据库 (DM Database)',
    defaultPort: 5236,
    asyncDriver: 'aioodbc',
    syncDriver: 'dmPython',
  },
  kingbase: {
    name: '人大金仓 (KingbaseES)',
    defaultPort: 54_321,
    asyncDriver: 'asyncpg',
    syncDriver: 'psycopg2',
  },
  oscar: {
    name: '神通数据库 (Oscar)',
    defaultPort: 2003,
    asyncDriver: 'aioodbc',
    syncDriver: 'oscar',
  },
  highgo: {
    name: '瀚高数据库 (HighGo DB)',
    defaultPort: 5866,
    asyncDriver: 'asyncpg',
    syncDriver: 'psycopg2',
  },
  gbase: {
    name: '南大通用 (GBase)',
    defaultPort: 5258,
    asyncDriver: 'aioodbc',
    syncDriver: 'gbase',
  },
  gaussdb: {
    name: '华为 GaussDB',
    defaultPort: 5432,
    asyncDriver: 'asyncpg',
    syncDriver: 'psycopg2',
  },

  // 其他数据库
  firebird: {
    name: 'Firebird',
    defaultPort: 3050,
    asyncDriver: 'aioodbc',
    syncDriver: 'fdb',
  },
  sybase: {
    name: 'Sybase ASE',
    defaultPort: 5000,
    asyncDriver: 'aioodbc',
    syncDriver: 'pyodbc',
  },
  informix: {
    name: 'IBM Informix',
    defaultPort: 9088,
    asyncDriver: 'aioodbc',
    syncDriver: 'informixdb',
  },
};

// 完整的 NoSQL 数据库支持列表
const NOSQL_DATABASES = {
  // 文档型数据库
  mongodb: {
    name: 'MongoDB',
    defaultPort: 27_017,
    asyncDriver: 'motor',
    syncDriver: 'pymongo',
  },
  couchdb: {
    name: 'Apache CouchDB',
    defaultPort: 5984,
    asyncDriver: 'aiocouch',
    syncDriver: 'couchdb',
  },

  // 键值型数据库
  redis: {
    name: 'Redis',
    defaultPort: 6379,
    asyncDriver: 'aioredis',
    syncDriver: 'redis',
  },
  memcached: {
    name: 'Memcached',
    defaultPort: 11_211,
    asyncDriver: 'aiomcache',
    syncDriver: 'pymemcache',
  },

  // 列族型数据库
  cassandra: {
    name: 'Apache Cassandra',
    defaultPort: 9042,
    asyncDriver: 'cassandra-driver',
    syncDriver: 'cassandra-driver',
  },
  hbase: {
    name: 'Apache HBase',
    defaultPort: 2181,
    asyncDriver: 'happybase',
    syncDriver: 'happybase',
  },

  // 图数据库
  neo4j: {
    name: 'Neo4j',
    defaultPort: 7687,
    asyncDriver: 'neo4j',
    syncDriver: 'neo4j',
  },
  arangodb: {
    name: 'ArangoDB',
    defaultPort: 8529,
    asyncDriver: 'python-arango',
    syncDriver: 'python-arango',
  },
};

// 合并所有数据库类型
const ALL_DATABASES = { ...RDBMS_DATABASES, ...NOSQL_DATABASES };

// 数据库类型选项
const dbTypeOptions = Object.values(InfraDbTypeEnum).map((item) => ({
  value: item.value,
  label: item.label,
}));

// URL配置数据结构
interface UrlConfig {
  dbType: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  schema: string;
  useAsync: boolean;
  filePath?: string; // 用于SQLite等文件数据库
}

// 默认URL配置
const defaultUrlConfig: UrlConfig = {
  dbType: 'mysql',
  host: 'localhost',
  port: 3306,
  database: '',
  username: '',
  password: '',
  schema: '',
  useAsync: true,
  filePath: '',
};

// URL配置数据
const urlConfig = reactive<UrlConfig>({ ...defaultUrlConfig });

// 判断是否为文件数据库
const isFileDatabase = computed(() => {
  return ['sqlite'].includes(urlConfig.dbType);
});

// 判断是否需要用户名密码
const needsCredentials = computed(() => {
  return !['memcached', 'redis', 'sqlite'].includes(urlConfig.dbType);
});

// 判断是否需要端口
const needsPort = computed(() => {
  return urlConfig.dbType !== 'sqlite';
});

// 判断是否需要数据库名
const needsDatabase = computed(() => {
  return !['memcached', 'redis', 'sqlite'].includes(urlConfig.dbType);
});

// 获取当前数据库配置
const currentDbConfig = computed(() => {
  return ALL_DATABASES[urlConfig.dbType as keyof typeof ALL_DATABASES];
});

// 生成的URL
const generatedUrl = computed(() => {
  const dbConfig = currentDbConfig.value;
  if (!dbConfig) return '';

  switch (urlConfig.dbType) {
    case 'mongodb': {
      const protocol = urlConfig.useAsync ? 'mongodb+motor' : 'mongodb+pymongo';
      return `${protocol}://${urlConfig.username}:${encodeURIComponent(urlConfig.password)}@${urlConfig.host}:${urlConfig.port}/${urlConfig.database}`;
    }
    case 'mssql': {
      const protocol = urlConfig.useAsync ? 'mssql+aioodbc' : 'mssql+pyodbc';
      return `${protocol}://${urlConfig.username}:${encodeURIComponent(urlConfig.password)}@${urlConfig.host}:${urlConfig.port}/${urlConfig.database}`;
    }
    case 'mysql': {
      const protocol = urlConfig.useAsync ? 'mysql+aiomysql' : 'mysql+pymysql';
      return `${protocol}://${urlConfig.username}:${encodeURIComponent(urlConfig.password)}@${urlConfig.host}:${urlConfig.port}/${urlConfig.database}`;
    }
    case 'neo4j': {
      const protocol = urlConfig.useAsync ? 'neo4j+neo4j' : 'neo4j+neo4j';
      return `${protocol}://${urlConfig.username}:${encodeURIComponent(urlConfig.password)}@${urlConfig.host}:${urlConfig.port}`;
    }
    case 'oracle': {
      const protocol = urlConfig.useAsync
        ? 'oracle+oracledb'
        : 'oracle+cx_oracle';
      return `${protocol}://${urlConfig.username}:${encodeURIComponent(urlConfig.password)}@${urlConfig.host}:${urlConfig.port}/${urlConfig.database}`;
    }
    case 'postgresql': {
      const protocol = urlConfig.useAsync
        ? 'postgresql+asyncpg'
        : 'postgresql+psycopg2';
      const schemaPart = urlConfig.schema ? `?schema=${urlConfig.schema}` : '';
      return `${protocol}://${urlConfig.username}:${encodeURIComponent(urlConfig.password)}@${urlConfig.host}:${urlConfig.port}/${urlConfig.database}${schemaPart}`;
    }
    case 'redis': {
      const protocol = urlConfig.useAsync ? 'redis+aioredis' : 'redis+redis';
      return `${protocol}://${urlConfig.host}:${urlConfig.port}`;
    }
    case 'sqlite': {
      const protocol = urlConfig.useAsync
        ? 'sqlite+aiosqlite'
        : 'sqlite+sqlite3';
      return `${protocol}:///${urlConfig.filePath || urlConfig.database}`;
    }
    default: {
      // 通用处理方式
      const protocol = urlConfig.useAsync
        ? `${urlConfig.dbType}+${dbConfig.asyncDriver}`
        : `${urlConfig.dbType}+${dbConfig.syncDriver}`;
      return needsCredentials.value
        ? `${protocol}://${urlConfig.username}:${encodeURIComponent(urlConfig.password)}@${urlConfig.host}:${urlConfig.port}/${urlConfig.database}`
        : `${protocol}://${urlConfig.host}:${urlConfig.port}/${urlConfig.database}`;
    }
  }
});

// 监听URL配置变化，更新生成的URL
watch(
  () => urlConfig,
  () => {
    emit('update:modelValue', generatedUrl.value);
  },
  { deep: true },
);

// 监听modelValue变化，解析URL
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      parseUrl(newVal);
    }
  },
);

// 解析URL字符串
function parseUrl(url: string) {
  try {
    let normalizedUrl = url;
    let dbType = 'mysql';
    let useAsync = true;

    // 解析数据库类型和驱动
    const dbTypes = Object.keys(ALL_DATABASES);
    for (const type of dbTypes) {
      const dbConfig = ALL_DATABASES[type as keyof typeof ALL_DATABASES];

      // 检查异步驱动
      if (url.includes(`+${dbConfig.asyncDriver}`)) {
        dbType = type;
        useAsync = true;
        normalizedUrl = url.replace(`+${dbConfig.asyncDriver}`, '');
        break;
      }
      // 检查同步驱动
      else if (url.includes(`+${dbConfig.syncDriver}`)) {
        dbType = type;
        useAsync = false;
        normalizedUrl = url.replace(`+${dbConfig.syncDriver}`, '');
        break;
      }
      // 检查基本协议
      else if (url.startsWith(`${type}:`)) {
        dbType = type;
        break;
      }
    }

    // 特殊处理SQLite
    if (dbType === 'sqlite') {
      urlConfig.dbType = dbType;
      urlConfig.useAsync = useAsync;
      urlConfig.filePath = url.replace(/^sqlite[^:]*:\/\/\//, '');
      return;
    }

    // 解析标准URL格式
    const urlObj = new URL(normalizedUrl);

    urlConfig.dbType = dbType;
    urlConfig.useAsync = useAsync;
    urlConfig.host = urlObj.hostname || 'localhost';
    urlConfig.port = urlObj.port
      ? Number.parseInt(urlObj.port)
      : getDefaultPort(dbType);

    if (urlObj.username) {
      urlConfig.username = urlObj.username;
    }
    if (urlObj.password) {
      urlConfig.password = decodeURIComponent(urlObj.password);
    }

    if (urlObj.pathname) {
      const path = urlObj.pathname;
      urlConfig.database = path.startsWith('/') ? path.slice(1) : path;
    }

    if (urlObj.searchParams) {
      urlConfig.schema = urlObj.searchParams.get('schema') || '';
    }
  } catch (error) {
    console.warn('Failed to parse URL:', error);
  }
}

// 获取默认端口
function getDefaultPort(dbType: string): number {
  const dbConfig = ALL_DATABASES[dbType as keyof typeof ALL_DATABASES];
  return dbConfig?.defaultPort || 3306;
}

// 组件挂载时初始化
onMounted(() => {
  if (props.modelValue) {
    parseUrl(props.modelValue);
  }
});

// 手动修改URL时的处理
function onUrlInput(value: string) {
  emit('update:modelValue', value);
}

// 数据库类型变化时的处理
function onDbTypeChange() {
  const dbConfig = currentDbConfig.value;
  if (dbConfig) {
    urlConfig.port = dbConfig.defaultPort;
  }
}
</script>

<template>
  <div class="data-source-url rounded-md border border-gray-200 p-4">
    <ElTabs type="card">
      <ElTabPane label="URL配置">
        <ElForm :model="urlConfig" label-width="120px">
          <ElFormItem label="数据库类型">
            <ElSelect
              v-model="urlConfig.dbType"
              placeholder="请选择数据库类型"
              @change="onDbTypeChange"
            >
              <ElOption
                v-for="item in dbTypeOptions"
                :key="item.value as string"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="连接模式">
            <ElCheckbox v-model="urlConfig.useAsync">
              使用异步驱动 (推荐)
            </ElCheckbox>
          </ElFormItem>

          <ElFormItem v-if="!isFileDatabase" label="主机地址">
            <ElInput v-model="urlConfig.host" placeholder="请输入主机地址" />
          </ElFormItem>

          <ElFormItem v-if="needsPort" label="端口">
            <ElInputNumber v-model="urlConfig.port" :min="1" :max="65535" />
          </ElFormItem>

          <ElFormItem v-if="isFileDatabase" label="文件路径">
            <ElInput
              v-model="urlConfig.filePath"
              placeholder="请输入数据库文件路径"
            />
          </ElFormItem>

          <ElFormItem v-if="needsDatabase" label="数据库名">
            <ElInput
              v-model="urlConfig.database"
              placeholder="请输入数据库名"
            />
          </ElFormItem>

          <ElFormItem v-if="needsCredentials" label="用户名">
            <ElInput v-model="urlConfig.username" placeholder="请输入用户名" />
          </ElFormItem>

          <ElFormItem v-if="needsCredentials" label="密码">
            <ElInput
              v-model="urlConfig.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </ElFormItem>

          <ElFormItem v-if="urlConfig.dbType === 'postgresql'" label="Schema">
            <ElInput v-model="urlConfig.schema" placeholder="请输入Schema" />
          </ElFormItem>
        </ElForm>
      </ElTabPane>

      <ElTabPane label="生成的URL">
        <ElInput
          v-model="generatedUrl"
          type="textarea"
          :rows="4"
          placeholder="自动生成的数据库连接URL"
          @input="onUrlInput"
        />
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style scoped>
.data-source-url {
  width: 100%;
}
</style>
