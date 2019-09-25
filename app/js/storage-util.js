/**
 * Helper functions for SessionStorage
 */

module.exports = {
  populateStorage,
  setDomainInfo,
  setUserlistInfo
};

const Constants = require('../constants');

function populateStorage() {
  // Populate Get-ADDomain Values
  sessionStorage.setItem(Constants.DOMAIN.ALLOWED_DNS_SUFFIXES, '[]');
  sessionStorage.setItem(Constants.DOMAIN.CHILD_DOMAINS, '[]');
  sessionStorage.setItem(Constants.DOMAIN.COMPUTERS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.DNS_ROOT, '');
  sessionStorage.setItem(Constants.DOMAIN.DELETED_OBJECTS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.DISTINGUISHED_NAME, '');
  sessionStorage.setItem(Constants.DOMAIN.DOMAIN_CONTROLLERS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.DOMAIN_MODE, '');
  sessionStorage.setItem(Constants.DOMAIN.DOMAIN_SID, '{}');
  sessionStorage.setItem(
    Constants.DOMAIN.FOREIGN_SECURITY_PRINCIPALS_CONTAINER,
    ''
  );
  sessionStorage.setItem(Constants.DOMAIN.FOREST, '');
  sessionStorage.setItem(Constants.DOMAIN.INFRASTRUCTURE_MASTER, '');
  sessionStorage.setItem(Constants.DOMAIN.LAST_LOGON_REPLICATION_INTERVAL, '');
  sessionStorage.setItem(Constants.DOMAIN.LINKED_GROUP_POLICY_OBJECTS, '[]');
  sessionStorage.setItem(Constants.DOMAIN.LOST_AND_FOUND_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.MANAGED_BY, '');
  sessionStorage.setItem(Constants.DOMAIN.NAME, '');
  sessionStorage.setItem(Constants.DOMAIN.NET_BIOS_NAME, '');
  sessionStorage.setItem(Constants.DOMAIN.OBJECT_CLASS, '');
  sessionStorage.setItem(Constants.DOMAIN.OBJECT_GUID, '');
  sessionStorage.setItem(Constants.DOMAIN.PDC_EMULATOR, '');
  sessionStorage.setItem(Constants.DOMAIN.PARENT_DOMAIN, '');
  sessionStorage.setItem(
    Constants.DOMAIN.PUBLIC_KEY_REQUIRED_PASSWORD_ROLLING,
    ''
  );
  sessionStorage.setItem(Constants.DOMAIN.QUOTAS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.RID_MASTER, '');
  sessionStorage.setItem(
    Constants.DOMAIN.READ_ONLY_REPLICAT_DIRECTORY_SERVERS,
    '[]'
  );
  sessionStorage.setItem(Constants.DOMAIN.REPLICA_DIRECTORY_SERVERS, '[]');
  sessionStorage.setItem(Constants.DOMAIN.SUBORDINATE_REFERENCES, '[]');
  sessionStorage.setItem(Constants.DOMAIN.SYSTEMS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.USERS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.USER_TOTAL, '');
  sessionStorage.setItem(Constants.DOMAIN.DISABLED_USER_TOTAL, '');
  sessionStorage.setItem(Constants.DOMAIN.COMPUTER_TOTAL, '');
  sessionStorage.setItem(Constants.DOMAIN.DISABLED_COMPUTER_TOTAL, '');
  // Set other big values
  sessionStorage.setItem(Constants.USERSLIST, '[]');
  sessionStorage.setItem(Constants.COMPUTERSLIST, '[]');
}

function setDomainInfo(domainJSON) {
  sessionStorage.setItem(
    Constants.DOMAIN.ALLOWED_DNS_SUFFIXES,
    JSON.stringify(domainJSON.AllowedDNSSuffixes)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.CHILD_DOMAINS,
    JSON.stringify(domainJSON.ChildDomains)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.COMPUTERS_CONTAINER,
    domainJSON.ComputersContainer
  );
  sessionStorage.setItem(Constants.DOMAIN.DNS_ROOT, domainJSON.DNSRoot);
  sessionStorage.setItem(
    Constants.DOMAIN.DELETED_OBJECTS_CONTAINER,
    domainJSON.DeletedObjectsContainer
  );
  sessionStorage.setItem(
    Constants.DOMAIN.DISTINGUISHED_NAME,
    domainJSON.DistinguishedName
  );
  sessionStorage.setItem(
    Constants.DOMAIN.DOMAIN_CONTROLLERS_CONTAINER,
    domainJSON.DomainControllersContainer
  );
  sessionStorage.setItem(
    Constants.DOMAIN.DOMAIN_MODE,
    Constants.DOMAIN_MODE_ENUM[domainJSON.DomainMode]
  );
  sessionStorage.setItem(
    Constants.DOMAIN.DOMAIN_SID,
    JSON.stringify(domainJSON.DomainSID)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.FOREIGN_SECURITY_PRINCIPALS_CONTAINER,
    domainJSON.ForeignSecurityPrincipalsContainer
  );
  sessionStorage.setItem(Constants.DOMAIN.FOREST, domainJSON.Forest);
  sessionStorage.setItem(
    Constants.DOMAIN.INFRASTRUCTURE_MASTER,
    domainJSON.InfrastructureMaster
  );
  sessionStorage.setItem(
    Constants.DOMAIN.LAST_LOGON_REPLICATION_INTERVAL,
    domainJSON.LastLogonReplicationInterval
  );
  sessionStorage.setItem(
    Constants.DOMAIN.LINKED_GROUP_POLICY_OBJECTS,
    JSON.stringify(domainJSON.LinkedGroupPolicyObjects)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.LOST_AND_FOUND_CONTAINER,
    domainJSON.LostAndFoundContainer
  );
  sessionStorage.setItem(Constants.DOMAIN.MANAGED_BY, domainJSON.ManagedBy);
  sessionStorage.setItem(Constants.DOMAIN.NAME, domainJSON.Name);
  sessionStorage.setItem(
    Constants.DOMAIN.NET_BIOS_NAME,
    domainJSON.NetBIOSName
  );
  sessionStorage.setItem(Constants.DOMAIN.OBJECT_CLASS, domainJSON.ObjectClass);
  sessionStorage.setItem(Constants.DOMAIN.OBJECT_GUID, domainJSON.objectGUID);
  sessionStorage.setItem(Constants.DOMAIN.PDC_EMULATOR, domainJSON.PDCEmulator);
  sessionStorage.setItem(
    Constants.DOMAIN.PARENT_DOMAIN,
    domainJSON.ParentDomain
  );
  sessionStorage.setItem(
    Constants.DOMAIN.PUBLIC_KEY_REQUIRED_PASSWORD_ROLLING,
    domainJSON.PublicKeyRequiredPasswordRolling
  );
  sessionStorage.setItem(
    Constants.DOMAIN.QUOTAS_CONTAINER,
    domainJSON.QuotasContainer
  );
  sessionStorage.setItem(Constants.DOMAIN.RID_MASTER, domainJSON.RIDMaster);
  sessionStorage.setItem(
    Constants.DOMAIN.READ_ONLY_REPLICAT_DIRECTORY_SERVERS,
    JSON.stringify(domainJSON.ReadOnlyReplicaDirectoryServers)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.REPLICA_DIRECTORY_SERVERS,
    JSON.stringify(domainJSON.ReplicaDirectoryServers)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.SUBORDINATE_REFERENCES,
    JSON.stringify(domainJSON.SubordinateReferences)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.SYSTEMS_CONTAINER,
    domainJSON.SystemsContainer
  );
  sessionStorage.setItem(
    Constants.DOMAIN.USERS_CONTAINER,
    domainJSON.UsersContainer
  );
}

function setUserlistInfo(userlistJson) {
  sessionStorage.setItem(Constants.USERSLIST, JSON.stringify(userlistJson));
  sessionStorage.setItem(Constants.DOMAIN.USER_TOTAL, userlistJson.length);

  // Calculate and store which users are disabled
  let disabledUsers = 0;
  userlistJson.map(user => {
    if (!user.Enabled) disabledUsers++;
  });
  sessionStorage.setItem(Constants.DOMAIN.DISABLED_USER_TOTAL, disabledUsers);
}
