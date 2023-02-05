# UDP Peer to Peer Secure Data Transfer

## Overview

This project aims to implement secure, high-speed peer-to-peer data transfer between two agents (Data Foundation and Partner) using NodeJS servers. The transfer uses UDP for data transfer and TCP for transfer quality control. The project involves creating Data Transfer Profiles for each agent, which include details such as IP addresses, host names, and port details. The data transfer is initiated by setting up a transfer request with parameters such as number of threads, IP addresses, and schedule time. The project includes a web-based monitoring system to monitor the data transfer session. Additionally, the project involves integrating the Data Foundation with the file system and MinIO.

**Use cases for this platform include**:

---

## Tasks
| Task | Date Started | Date Completed | Notes | PRs | Issue |
| -------- | ------- | ----------|-----|-----|-------- |
| Repo Creation | 05-02-2022 | 05-02-2022 | | | |

## Requirements

UDP Peer to Peer Secure Data Transfer
- Secure high speed peer to peer data transfer from/to Data Foundation Server
- Data Transfer between two Agents (Data Foundation and Partner ) with the help of NodeJS servers
    - UDP for data transfer
    - TCP for transfer quality control
- Data Foundation and Partner Data Tansfer Profile detail:
    - Data Foundation Agent(s) Details: Partner ID, Partner Public Key, Partner Private Key, Data Send / Receive directory, Host name, IP Address, port details
    - Partner Agent(s) Details: Partner ID, Partner Public Key, Partner Private Key, Data Send / Receive directory, Host name, IP Address, port details
- Data Transfer Request Setup ( Sender and Receiver DT Profiles, Transfer Configuration: (#threads, IP addresses, ports, schedule time, # of files, Total Files Size, md key)
- Add Files
- Schedule/initiate Data Transfer Request
- DT Profile key verification. On success, Initiate Data transfer (send / receive)
- Data Transfer Session Monitor ( Web based monitoring)
- Data Foundation Integration: File System Integration + MinIO Integration


## Technical Requirements






## System Design 


## Pipeline and Workflow


## Workflow of the System


## Basic Design of the Webapp




## Sub Components




