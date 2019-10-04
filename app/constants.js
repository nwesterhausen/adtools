const DOMAIN_MODE_ENUM = [
  'Windows2000Domain',
  'Windows2003InterimDomain',
  'Windows2003Domain',
  'Windows2008Domain',
  'Windows2008R2Domain',
  'Windows2012Domain',
  'Windows2012R2Domain',
  'WinThreshold'
];
const DOMAIN = {
  ALLOWED_DNS_SUFFIXES: 'DomainAllowedDNSSuffixes', // array
  CHILD_DOMAINS: 'DomainChildDomains', // array
  COMPUTERS_CONTAINER: 'DomainComputersContainer', // LDAP string
  DNS_ROOT: 'DomainDNSRoot', // string
  DELETED_OBJECTS_CONTAINER: 'DomainDeletedObjectsContainer', // LDAP string
  DISTINGUISHED_NAME: 'DomainDistinguishedName', // LDAP string
  DOMAIN_CONTROLLERS_CONTAINER: 'DomainDomainControllersContainer', // LDAP string
  DOMAIN_MODE: 'DomainDomainMode', // string
  DOMAIN_SID: 'DomainDomainSID', // obj
  FOREIGN_SECURITY_PRINCIPALS_CONTAINER: 'DomainForeignSecurityPrincipalsContainer', // LDAP string
  FOREST: 'DomainForest', // string
  INFRASTRUCTURE_MASTER: 'DomainInfrastructureMaster', // string
  LAST_LOGON_REPLICATION_INTERVAL: 'DomainLastLogonReplicationInterval', // string
  LINKED_GROUP_POLICY_OBJECTS: 'DomainLinkedGroupPolicyObjects ', // array
  LOST_AND_FOUND_CONTAINER: 'DomainLostAndFoundContainer', // LDAP string
  MANAGED_BY: 'DomainManagedBy', // string
  NAME: 'DomainName', // string
  NET_BIOS_NAME: 'DomainNetBIOSName', // string
  OBJECT_CLASS: 'DomainObjectClass', // string
  OBJECT_GUID: 'DomainObjectGUID', // guid
  PDC_EMULATOR: 'DomainPDCEmulator', // string
  PARENT_DOMAIN: 'DomainParentDomain', // string
  PUBLIC_KEY_REQUIRED_PASSWORD_ROLLING: 'DomainPublicKeyRequiredPasswordRolling', // string
  QUOTAS_CONTAINER: 'DomainQuotasContainer', // LDAP string
  RID_MASTER: 'DomainRIDMaster', // string
  READ_ONLY_REPLICAT_DIRECTORY_SERVERS: 'DomainReadOnlyReplicaDirectoryServers', // array
  REPLICA_DIRECTORY_SERVERS: 'DomainReplicaDirectoryServers', // array
  SUBORDINATE_REFERENCES: 'DomainSubordinateReferences', // array
  SYSTEMS_CONTAINER: 'DomainSystemsContainer', // LDAP string
  USERS_CONTAINER: 'DomainUsersContainer', // LDAP string
  USER_TOTAL: 'DomainTotalUsers', // Int
  DISABLED_USER_TOTAL: 'DomainTotalDisabledUsers', // Int
  COMPUTER_TOTAL: 'DomainTotalComputers', // Int
  DISABLED_COMPUTER_TOTAL: 'DomainTotalDisabledComputers' // Int
};
const USERSLIST = 'AllADUsers'; // array
const COMPUTERSLIST = 'AllADComputers'; //array
const SETTINGS = {
  PREFERENCES: 'preferences',
  COMPANY_OPTIONS: 'companies',
  DEPARTMENT_OPTIONS: 'departments',
  TITLE_OPTIONS: 'titles',
  PROXY_DOMAIN_OPTIONS: 'proxyDomains'
};
const DEFAULT_PREFERENCES = {
  fileLevelLogging: 'info'
};
const PREFERENCES = {
  fileLevelLogging: {
    options: [false, 'debug', 'info', 'warning', 'error'],
    default: DEFAULT_PREFERENCES.fileLevelLogging,
    name: 'Log level for file',
    type: 'select'
  }
};

module.exports = {
  DOMAIN_MODE_ENUM,
  DOMAIN,
  USERSLIST,
  COMPUTERSLIST,
  SETTINGS,
  DEFAULT_PREFERENCES,
  PREFERENCES
};
