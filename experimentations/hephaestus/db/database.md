# Hephaestus DB
- One Schema per customer - separation of concerns if DFNS
- One Schema per legal entity/jurisdiction - if ZC

## Schema DB

```sql
create schema hephaestus;

drop table hephaestus.organization;
create table hephaestus.organization (
    id varchar(255) primary key,
    payload jsonb not null,
    counter serial,
    created timestamp default current_timestamp
);

drop table hephaestus.linkedOrgs;
create table hephaestus.linkedOrgs (
    id varchar(255) not null,
    linkedId varchar(255) not null,
    counter serial,
    created timestamp default current_timestamp,
    primary key(id, linkedId)
);

drop table hephaestus.actor;
create table hephaestus.actor (
    id varchar(255) primary key,
    payload jsonb not null,
    counter serial,
    created timestamp default current_timestamp
);

drop table hephaestus.policy;
create table hephaestus.policy (
    id varchar(255) primary key,
    payload jsonb not null,
    counter serial,
    created timestamp default current_timestamp
);

drop table hephaestus.policyrule;
create table hephaestus.policyrule (
    id varchar(255) primary key,
    payload jsonb not null,
    counter serial,
    created timestamp default current_timestamp
);

drop table hephaestus.policycontrol;
create table hephaestus.policycontrol (
    id varchar(255) primary key,
    payload jsonb not null,
    counter serial,
    created timestamp default current_timestamp
);

drop table hephaestus.wish;
create table hephaestus.wish (
    id varchar(255) primary key,
    payload jsonb not null,
    counter serial,
    created timestamp default current_timestamp
);

drop table hephaestus.jobs;
create table hephaestus.jobs (
    id varchar(255) primary key,
    jobtype varchar(64),
    processed varchar(64) default 'NEW',
    payload jsonb not null,
    counter serial,
    created timestamp default current_timestamp
);

drop table hephaestus.wallets;
create table hephaestus.wallets (
    id varchar(255) primary key,
    provider varchar(64) not null,
    hephaestusPayload jsonb not null,
    providerPayload jsonb not null,
    counter serial,
    created timestamp default current_timestamp
);

drop table hephaestus.appliedcontrols;
create table hephaestus.appliedcontrols (
    wishId varchar(255),
    policyControlId varchar(255),
    expression varchar(10240),
    status varchar(64) default 'NEW',
    counter serial,
    created timestamp default current_timestamp,
    primary key(wishId, policyControlId)
)

drop table hephaestus.settlement;
create table hephaestus.settlement (
    settlementId varchar(255) primary key,
    processed varchar(64) default 'NEW',
    settlementData varchar(1024) not null,
    transfer1 jsonb null,
    transfer2 jsonb null,
    counter serial,
    created timestamp default current_timestamp
)

select * from hephaestus.organization;
select payload from hephaestus.actor where id = 'LUCY';
select * from hephaestus.actor
select * from hephaestus.policy
select * from hephaestus.policyrule
select payload from hephaestus.policyrule where id = 'hss-wish-pol-1-9a2ed6276c00bd79';
select * from hephaestus.policycontrol
select * from hephaestus.wallets;
select hephaestuspayload from hephaestus.wallets where hephaestuspayload->>'orgId' = 'ORG1';
select hephaestuspayload from hephaestus.wallets ;
select * from hephaestus.wish
select * from hephaestus.jobs
update hephaestus.jobs set processed = 'SUCCESS';
select * from hephaestus.appliedcontrols;
select * from hephaestus.settlement;
select * from hephaestus.settlement where transfer1 is null and transfer2 is null limit 1;
update hephaestus.settlement set processed = 'NEW' 
select * from hephaestus.linkedorgs;
select linkedid from hephaestus.linkedorgs where id = 'ORG1';


--selectRuleData org-wish-rule-f583c3cc09479e63
-- selectRuleData org-create-pol-rule-046a39d42387195e
-- selectRuleData org1-create-pol-248231a6ddec7d12
select payload from hephaestus.policyrule where id = 'org1-create-pol-0454ec6b0569d583';

-- CLEANUP
delete from hephaestus.organization;
delete from hephaestus.linkedOrgs;
delete from hephaestus.actor;
delete from hephaestus.policy;
delete from hephaestus.policyrule;
delete from hephaestus.policycontrol;
delete from hephaestus.wallets;
delete from hephaestus.wish;
delete from hephaestus.jobs;
delete from hephaestus.appliedcontrols;
delete from hephaestus.settlement;
```