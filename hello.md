# CHAPTER 8: PROJECT PLAN

## Introduction

A project plan sometimes also known as a work plan serves as clear a definition of the goals, objectives, and tasks that need to be performed by a team in respect of a particular project. A project should include key elements such as the project planning phase, project timeline, project activities, project phases, and project checklist of project deliverables for every step of the life cycle of the project. Creating a proper project plan helps the effective completion of a project as formulating project plans means dividing a project into various smaller phases and chunking the large task into smaller and achievable tasks within a well-organized timeline with a proper execution strategy (Foster & Jr., 2021).

## Features

• User Registration and Authentication
• Auction Item Listing and Management
• Real-time Bidding System
• Payment Gateway Integration
• Item Authentication by Experts
• Notification System
• Admin Dashboard and Management
• Search and Filter Functionality
• Auction History and Reports
• Dispute Resolution System
• Category Management

## Release Plan

The release plan outlines the stages for rolling out the project in a controlled and phased manner. In software development, a release plan defines the strategy implemented that will be used to deliver the product and the respective time frame in which various phases need to be completed (Fibery.io, 2024). Each phase in the release plan focuses on aspects such as implementing, testing, and deploying specific product features to ensure an effective and smooth launch.

**Table 37: Project Plan**

| Release Version | Scheduled Release | Key Features |
|-----------------|-------------------|--------------|
| 1.0 | Week 1 | • User Registration and Login<br/>• Basic Profile Management (Buyer/Seller)<br/>• Auction Item Listings<br/>• Category Management<br/>• Unit Test |
| 2.0 | Week 2 | • Enhanced Auction Item Details<br/>• Item Authentication Request<br/>• Expert Authentication System<br/>• Initial Bidding Functionality<br/>• Basic Payment Integration |
| 3.0 | Week 3 | • Real-time Bidding System<br/>• Manage Auction Items (Sellers)<br/>• Manage Categories (Admin)<br/>• Notification System<br/>• Auto-bidding Feature |
| 4.0 | Week 4 | • Filter and Search Auctions<br/>• Advanced Payment Processing<br/>• Auction History and Reports<br/>• Email Integration for Notifications<br/>• Dispute Resolution System |
| 5.0 | Week 5 | • eSewa Payment Gateway Integration<br/>• Admin Dashboard with Analytics<br/>• Final Security Enhancements<br/>• User Acceptance Testing (UAT)<br/>• Documentation (User and Technical) |

## Test Plan

In software development, a Test plan is a well-structured and formal document that defines the testing strategy, goals, and scope, which all are put together to make sure that all the components of the software are tested ensuring that there is sufficient testing before the release of the software into the market for use (Hamilton, 2024). The plan includes how all testing of the software is going to be accomplished that meet the objectives for the testing of the software. It is one of the important phases of any software development methodologies and it makes sure that applications do not have many faults before release.

### Unit Testing Plan

**Table 38: Test plan for User Registration and Authentication**

| Test Case ID | Test Case Description | Test Data | Expected Outcome | Pass/Fail Criteria |
|--------------|----------------------|-----------|------------------|-------------------|
| UA001 | Successful registration of the user | Valid email id, Valid user type (Buyer/Seller), Valid username, Strong password | The account for the user is created successfully | |
| UA002 | Email registration using existing email | Already existing email address | An error message on the screen informing email is already used by the user | |
| UA003 | Demo email ID for registration | Email ID that is not associated with any mail provider | An error message on the screen informs the user to use a legitimate email address | |
| UA004 | Weak password for registration | Short password | An error message on the screen informs the user to use at least 8 characters for registration | |
| UA005 | Valid Login Credentials | Registered email, Valid password | The user is successfully logged in and redirected to their respective dashboard according to user type | |

**Table 39: Test plan for adding auction item**

| Test Case ID | Test Case Description | Test Data | Expected Outcome | Pass/Fail Criteria |
|--------------|----------------------|-----------|------------------|-------------------|
| AI001 | Successful auction item creation | Item details (item name, description, category, starting price, reserve price, etc.) | The auction item is successfully created and displayed | |
| AI002 | Missing mandatory fields | Item details missing required fields (e.g. item name, category, starting price, auction duration, etc.) | An error message on the screen informing the required fields is unfilled | |
| AI003 | Valid file upload for item image | Item details including a valid image format | The image is uploaded successfully | |
| AI004 | Invalid file upload for item image | Item details include an invalid image format | An error message for invalid image format | |

**Table 40: Test plan for Real-time Bidding**

| Test Case ID | Test Case Description | Test Data | Expected Outcome | Pass/Fail Criteria |
|--------------|----------------------|-----------|------------------|-------------------|
| BD001 | Successful bid placement | Valid buyer profile, Valid auction ID, Bid amount higher than current bid | The bid is successfully placed and displayed in real-time | |
| BD002 | Bid lower than current highest | Bid amount lower than current highest bid | An error message informing the bid must be higher than current bid | |
| BD003 | Auction deadline exceeded | Bid attempted after auction has ended | Do not allow the user to place bid | |
| BD004 | Insufficient user balance | Bid placed without sufficient account balance | An error message for insufficient balance | |
| BD005 | Successful real-time notification | Valid bid placement by another user | Real-time notification sent to all active bidders | |

**Table 41: Test plan for "Item Authentication"**

| Test Case ID | Test Case Description | Test Data | Expected Outcome | Pass/Fail Criteria |
|--------------|----------------------|-----------|------------------|-------------------|
| AUTH001 | Valid authentication request | Valid seller profile, Complete item details with images | Successful authentication request submission | |
| AUTH002 | Missing authentication documents | Authentication request without required documents | An error message for completing required documentation | |
| AUTH003 | Expert approval process | Valid expert profile, Authentication request | Expert can approve or reject with detailed feedback | |
| AUTH004 | Authentication status tracking | Valid authentication request ID | User can track authentication status and progress | |

**Table 42: Test plan for "Payment Processing"**

| Test Case ID | Test Case Description | Test Data | Expected Outcome | Pass/Fail Criteria |
|--------------|----------------------|-----------|------------------|-------------------|
| PAY001 | Valid payment transaction | Valid buyer profile, Won auction ID, eSewa payment details | Successful payment processing and confirmation | |
| PAY002 | Failed payment processing | Invalid payment credentials or insufficient funds | Payment failure with appropriate error message | |
| PAY003 | Payment refund process | Valid refund request, Dispute resolution | Successful refund processing through eSewa | |
| PAY004 | Payment history tracking | Valid user profile with payment transactions | Complete payment history with transaction details | |

**Table 43: Test plan for "Auction Recommendation"**

| Test Case ID | Test Case Description | Test Data | Expected Outcome | Pass/Fail Criteria |
|--------------|----------------------|-----------|------------------|-------------------|
| REC001 | Category-based recommendation | User profile with preferred categories (e.g. pottery, jewelry, paintings, etc.) | Relevant auctions are recommended based on preferences | |
| REC002 | History-based recommendation | Auctions similar to previously bid items by the user | Similar auctions are recommended according to user bidding history | |
| REC003 | No matching auctions | User profile does not match with any available auction categories | A message indicating no auctions matched your profile | |
| REC004 | Price range recommendation | User profile with specified budget range | Auctions within user's budget range are recommended | |

**Table 44: Test plan for "Notification System"**

| Test Case ID | Test Case Description | Test Data | Expected Outcome | Pass/Fail Criteria |
|--------------|----------------------|-----------|------------------|-------------------|
| NOT001 | Bid notification delivery | Valid bid placement on user's watched items | Real-time notification sent to interested users | |
| NOT002 | Auction ending notification | Auction approaching end time with active bids | Email and in-app notifications sent to bidders | |
| NOT003 | Win/Loss notification | Auction completion with winner determination | Appropriate notification sent to winner and other bidders | |
| NOT004 | Authentication status notification | Item authentication completion by expert | Status notification sent to item owner | |

### User Acceptance Testing (UAT) Plan

**Table 45: UAT Plan for Registration and Login**

| Test case ID | Test Scenario | Steps to Execute | Expected Result | Actual Result | Status |
|--------------|---------------|------------------|-----------------|---------------|--------|
| UAT001 | Successful user registration | Fill out the form with a valid email, user type (Buyer/Seller), username, and password | The user account is created successfully and redirected to the login page | | |
| UAT002 | Registration with existing email | Enter an already registered email address | An error message indicating email address is already in use | | |
| UAT003 | Registration with an invalid email | Enter a demo or invalid email address | An error message informing the user to use a valid email address | | |
| UAT004 | Weak password registration | Enter a password with less than 8 characters and submit | An error message informing the user to use at least 8 characters for a password | | |
| UAT005 | Valid login | Enter a valid email and password | Successful login and user are navigated to their dashboard according to user type | | |
| UAT006 | Login with invalid credentials | Enter an invalid email or invalid password | An error message indicating credentials for login is invalid | | |
| UAT007 | Logout | Login with valid credentials and click on the logout button | User session is cleared and logged out redirecting them to the homepage | | |

**Table 46: UAT Plan for placing bids on auction items**

| Test case ID | Test Scenario | Steps to Execute | Expected Result | Actual Result | Status |
|--------------|---------------|------------------|-----------------|---------------|--------|
| BID001 | Successful bid placement | A buyer logging in with valid credentials navigates to available auctions, selects a suitable item, and places a bid | The buyer user places bid on the auction item and successfully submits the bid | | |
| BID002 | Place bid without login | Without login navigate to available auctions and attempt to bid | An error message informing the user to log in first to place bids | | |
| BID003 | Place bid on own item | Log in as seller and try to bid on own auction item | An error message informing the user cannot bid on their own items | | |
| BID004 | Bid on expired auction | Log in and try to bid on an auction that has already ended | Do not allow a user to place bid on expired auction | | |

**Table 47: UAT Plan for Auction and Bidding history**

| Test case ID | Test Scenario | Steps to Execute | Expected Result | Actual Result | Status |
|--------------|---------------|------------------|-----------------|---------------|--------|
| HST001 | View bidding history | A buyer logging in with valid credentials navigates to the history page and views the bid history | A list of previously placed bids with details such as item name, bid amount, auction status, etc. | | |
| HST002 | No bidding history | The buyer logged in and navigated to the history page when no bids had been placed | A message indicating users that they have not placed any bids till now | | |
| HST003 | View auction creation history | A seller logging in with valid credentials navigates to the history page and views created auction list | A list of previously created auctions with details such as item name, final price, auction status, etc. | | |
| HST004 | No auction creation history | The seller logged in and navigated to the history page when no auctions had been created | A message indicating to users that they have not created any auctions till now | | |

**Table 48: UAT Plan for Updating Auction information**

| Test case ID | Test Scenario | Steps to Execute | Expected Result | Actual Result | Status |
|--------------|---------------|------------------|-----------------|---------------|--------|
| UPA001 | Successful auction update | Log in as a seller navigate the list of created auctions, select an auction to update and make changes, and save the update | Auction is updated successfully with a confirmation message | | |
| UPA002 | Update without required fields | Log in as a seller navigate the list of created auctions, select an auction to update, and submit without filling required fields | An error message indicating that required fields are not filled | | |

## Summary

This chapter entails all the plans placed in the auction platform's development phase regarding which functionalities and pages are to be created in various weeks till which project needs to be completed. Testing is a crucial part of system validation and verification so that's why unit testing plans and user acceptance testing plans were formulated to validate the system in a later phase of the software development.

---

# CHAPTER 4: DESIGN AND IMPLEMENTATION

## 4.1 Introduction

System design is the planning and structuring of the auction platform prior to development. It encompasses establishing requirements, system architecture, user interface design, database design and workflow to make sure the solution achieves the objectives of the transparent bidding platform for antique objects. The design process involves the creation of clear representations of systems in the form of diagrams and models that can act as blueprints to development. This will guarantee that the system structure, features and user interface are well-designed prior to commencing the implementation.

Implementation refers to the phase when the intended design is implemented for the auction platform. It includes coding, assembling various modules, configuring the database, testing features, and releasing the system to be used in reality. Implementation, however, is the conversion of those designs into a working application through the development of the frontend and backend, the integration of system modules, connection of the database, and the testing of the application to ensure its functionality.

The combination of design and implementation phases makes the Transparent Bidding Platform for Antique Objects technically sound, user friendly and consistent with the objectives of the project.

**Figure 20: System Architecture Design**
*[Space for System Architecture Diagram]*

### Architecture Overview

The modern three-tier architecture of the auction platform is microservices-based, which means that it consists of the presentation layer (frontend), application layer (backend), and the data layer (database). The interaction between these layers is provided with the help of RESTful APIs and real-time communication channels using Socket.IO, which guarantee scalability, modularity, and the smooth user experience for real-time bidding functionality.

### Presentation Layer (Frontend)

The frontend is built with React 18 and Vite as a build tool to provide faster performance and optimized development experience. Tailwind CSS provides a mobile-first and responsive design, and React Router controls the navigation on the client-side. The reusable UI components are made possible by a component-based architecture, global state management using the Context API, and API communication using Axios. This design ensures the interface is user friendly, modular, and easy to maintain for auction browsing and bidding activities.

### Application Layer (Backend)

The backend is developed using Node.js and Express.js and has an MVC structure to keep concerns separated. The system uses SQLite database with direct SQL queries for lightweight deployment, and Socket.IO is implemented as a real-time communication tool that allows features like live bidding updates and instant notifications. The security is managed by JWT authentication, role-based access control (RBAC), and middleware pipelines to validate the requests. The backend is divided into controllers, services, models, and routes to be maintainable and scalable.

### Data Layer (Database)

The platform relies on SQLite as a lightweight relational database, which is handled with direct SQL queries for optimal performance. The database is normalized (3NF) and has foreign key constraints to provide referential integrity. Performance optimization is achieved by using indexing strategies, and ACID compliance is used to guarantee reliable transaction processing for auction and payment data.

### Integration Layer

The system is connected with various external services, such as eSewa Payment Gateway to execute secure payments for successful auction transactions, file upload systems to store and optimize auction item images, and email services to send notifications about bidding activities. The integration also includes real-time bidding updates through WebSockets. These integrations are based on RESTful APIs, WebSockets to provide real-time updates, and webhooks to communicate events.

### Security Architecture

The platform has security as a priority for handling sensitive auction and payment data. JWT tokens are used to support stateless authentication with role-based access control of various user roles (buyers, sellers, experts, admins). Password hashing with BCrypt, CORS configuration, input validation, and rate limiting are used to mitigate threats. The system implements secure protocols to protect all information during transit, especially for payment processing.

## 4.2 Design

The design stage of the auction platform is aimed at converting requirements into a blueprint that can be used to guide development. It contains system design diagrams e.g. use case diagrams, activity diagrams, sequence diagrams and system architecture to depict how various parts of the platform interact with each other. Interaction design is also taken into account, where user flow and navigation is made smooth and intuitive throughout the application for bidding activities. The design also determines the structure of the application, how it uses its assets, and the interface components to be used to maintain the consistency and usability of the application depending on the development methodology adopted. This step gives a graphical and structural diagram of the system and closes the gap between the conceptual requirements and the practical implementation.

### 4.2.1 Use Case Diagram

The Use Case Diagram shows how various users (actors) of the auction system interact to accomplish bidding and auction management purposes. It provides the key functionalities of the system and relationships among actors/use cases. Providing a mapping of these interactions assists developers, stakeholders, and designers to learn about the needs of users, the scope of the system and functionalities provided in the systems, which in turn acts as a guiding base to proceed with further system design and implementation.

**Table 3: Auction Platform - Use Case Diagram**
*[Space for Use Case Diagram]*

The Use Case Diagram of the Transparent Bidding Platform defines the interaction between the users and the system in the understanding of different user types. Guests can browse auctions, view item details, and register for accounts. Buyers can make registrations, browse auction items, place bids in real-time, set auto-bidding preferences, make payments through eSewa, and view their bidding history. Sellers can create auction listings, submit items for authentication, manage their auction items, set reserve prices, and view sales reports, whereas Experts can authenticate submitted items, verify provenance, and provide approval or rejection with detailed feedback. Admins have the ability to manage users, auction items, categories, resolve disputes, and view system analytics. System integrations are also indicated in the diagram, whereby the eSewa Payment Gateway will support any transaction and real-time bidding notifications will support user interactions. On the whole, it demonstrates the major functionalities and interactions in the platform, creating a clear visual presentation of tasks and functions of the users and system functions. It assists in realization of how the system is addressing the needs of the users and how it will facilitate effective operations among all parties in the auction ecosystem.

### 4.2.2 Activity Diagram

The Activity Diagram is one of the diagrams employed by the Unified Modeling Language (UML) which shows the logic of a flow of activities or actions within the auction system or a process. It presents the sequences of actions, choice points, and the parallel processes as well as the interactions between activities, allowing visualizing how auction-related operations are performed within the framework. Activity diagrams can be used to model business processes, workflows and system functionality so as to have a good picture of the interaction between various system components to accomplish bidding and auction management objectives.

**Figure 21: Activity Diagram: Auction Item Listing Flow**
*[Space for Activity Diagram]*

This diagram shows the entire auction item listing process, starting from item submission to final auction creation. It depicts the step-wise process of submitting item details, requesting expert authentication, waiting for approval, setting auction parameters, and publishing the auction with decision points on the success of authentication and validation processes.

**Figure 22: Real-time Bidding Flow**
*[Space for Activity Diagram]*

The diagram represents the process of placing bids in real-time where buyers will be able to browse active auctions, view current bid status, place competitive bids, and receive instant notifications. It also has validation procedures to ensure bid amounts are valid, user authentication checks, real-time updates to all participants, and confirmation of successful bid placement with proper error handling.

**Figure 23: Seller Auction Management Flow**
*[Space for Activity Diagram]*

The diagram illustrates the workflow of the seller in managing their auction items such as creating new listings, updating item details, monitoring bidding activity, and managing auction completion. It shows how new listings go through authentication, how sellers track auction progress, manage reserve prices, and handle post-auction activities with buyers.

**Figure 24: Expert Authentication Flow**
*[Space for Activity Diagram]*

This diagram describes the expert authentication procedure for item verification such as reviewing submitted antique items, verifying authenticity, checking provenance documentation, and providing approval or rejection decisions. It illustrates decision points of approvals or rejections, detailed feedback provision to sellers, and the general control of the quality of auction items to ensure platform standards for authentic antique objects.

**Figure 25: User Authentication Flow**
*[Space for Activity Diagram]*

This diagram outlines the user authentication flow that includes both registration and log in with email verification, password validation and JWT token generation for secure access to bidding functionalities. It will have error handling of invalid credentials, account activation via email verification, password reset, and secure session management using token refreshment for continuous auction participation.

## 4.3 Sequence Diagram

A Sequence Diagram is a type of the UML diagram that shows the interaction over time between objects or parts of the auction system. It centers on messages that are exchanged between the actors and system elements in order to affect a particular process or use case with an order. The sequence diagrams present the flow of interactions in a step-by-step manner and thus can visualize the way the auction system behaves, communication pattern along with the reasoning behind bidding processes. They can be of use in explaining requirements and designing system interaction details.

The Sequence Diagrams of the Auction Platform are below:

**Figure 26: Real-time Bidding Sequence**
*[Space for Sequence Diagram]*

This Sequence shows the entire bidding process by which a buyer searches auction items, views current bids, places competitive bids, and receives real-time updates. The sequence depicts the interactions between the buyer, frontend system, backend API, database, and Socket.IO real-time communication to make a successful bidding transaction with instant notifications to all participants.

**Figure 27: Item Authentication Sequence**
*[Space for Sequence Diagram]*

This sequence illustrates the process of item authentication where sellers submit antique items for expert verification and receive approval status. The flow illustrates the communication between the seller interface, authentication management system, expert dashboard, database operations, and notification services to complete the process of successful item verification and approval.

**Figure 28: Auction Creation and Management Sequence**
*[Space for Sequence Diagram]*

This illustration explains how sellers can manage their auction listings on the platform. The sequence includes the creation of new auction items, updating auction information, setting reserve prices, monitoring bidding activity, and managing auction completion through the seller dashboard with real-time updates.

**Figure 29: Payment Processing Sequence**
*[Space for Sequence Diagram]*

This flow shows how secure payment processing is performed after successful auction completion using eSewa integration. The diagram indicates how payment transactions are initiated, validated, processed, and confirmed with proper receipt generation and database updates for financial records.

**Figure 30: Admin Management Sequence**
*[Space for Sequence Diagram]*

This is a diagram showing the administrative management process of different platform entities like user accounts, auction oversight, category management, and dispute resolution. The sequence demonstrates how admins view system activities, make management decisions, resolve conflicts, and maintain platform integrity with proper stakeholder notifications.

**Figure 31: Real-time Notification Sequence**
*[Space for Sequence Diagram]*

This sequence outlines the real-time notification system using Socket.IO for instant bidding updates, auction status changes, and system alerts. The diagram shows how notifications are triggered, broadcasted to relevant users, delivered in real-time, and acknowledged by recipients to ensure seamless communication during auction activities.

## 4.4 Database Design

Database design refers to the process of designing and planning how auction-related data will be stored, organized and managed within the system. It is concerned with how to identify the most important entities such as users, auction items, bids, payments, and their attributes, and the relationships between them so that the database will support the functional requirements of the bidding platform. A properly-designed database enhances data consistency, minimizes redundancy, and makes data retrieval and management efficient for auction operations. It also guarantees data integrity, scalability, and security, which is a vital procedure in the development of reliable and effective auction information systems.

### 4.4.1 Entity Relationship Diagram

Entity-Relationship Diagram (ERD) is a diagrammatic representation of the auction data-model, which states the entities in the system and the interrelationships between each of the entities. It can be used as a guide in deriving the database structure by determining the principal entities, their properties and how they have been interrelated in the auction ecosystem.

**Figure 32: Entity Relationship Diagram of Auction Platform**
*[Space for ERD Diagram]*

The ERD is the database model of the Auction Platform, which reflects the key entities and their attributes and relationships for auction management. The Users table will have details of all participants of the platform, such as buyers, sellers, experts, and administrators, including their name, email, user type, contact details, and authentication information. Categories are essential for organizing auction items and they store information about item types, descriptions, and classification criteria.

Auction Items and Bids are linked to sellers and buyers respectively, enabling sellers to list antique objects and buyers to participate in competitive bidding. The Auctions and Bid_Requests entities monitor the auction lifecycle and bidding interactions, and Payments provide secure transaction management through eSewa integration.

Item Authentication entities enable expert verification of antique objects, ensuring authenticity and quality control. Notifications keep users informed about bidding activities, auction status changes, and system alerts for real-time engagement.

This design will guarantee a clear relationship between entities, multi-user interaction, secure bidding processes, and a solid base to manage auction services efficiently while maintaining data integrity and supporting real-time operations.

## 4.5 Database Schema

A database schema is the general construction or design of the auction database which encompasses how auction information is categorized, as well as how it is manipulated. It contains a description of how tables are organized, what fields (columns), data types and relations between different tables for auction operations. In the simplest terms it serves as a roadmap to the storage, connectivity and access of auction-related information in the database.

**Figure 33: Database Schema of Auction Platform**
*[Space for Database Schema Diagram]*

The database schema of the Auction Platform is tailored to effectively work with users, auction items, bids, payments, authentication, and other auction-related activities. It is made up of multiple related tables that are designed in accordance with the principles of the Third Normal Form (3NF) to guarantee data integrity, reduce redundancy, and maximize performance. Users table is used to manage the access of buyers, sellers, experts, and admins based on their roles, whereas Categories, Auction_Items, and Auctions tables contain the auction content and management information. Bids and Payments tables handle bidding activities and financial transactions, including eSewa integration, and Authentication_Requests handle expert verification processes. Notifications and Activity_Logs offer user engagement and system monitoring tools. The schema has referential integrity with foreign keys, flexible data storage capabilities, and security with password hashing and role-based access. All in all, it offers a flexible, systematic, and safe framework to enable the complete functionality of the transparent bidding platform for antique objects.

## 4.6 Interface Design

The Auction Platform system interface is designed in an approach where users will find it friendly and easy to navigate through it in the event of different users like buyers, sellers, experts, and administrators. It also incorporates clear menu systems, logical pathway through the system and similarity of page layout to offer an easy auction browsing and bidding experience. Wireframes are added to visually describe how the important elements like navigation bars, auction item displays, bidding interfaces, buttons, and forms are to be placed before the actual implementation is made. The benefit of these wireframes is that they helped to make any further improvements to the usability, and were also able to make sure that the frontend design will encourage smooth interaction with the auction platform.

### 4.6.1 Wireframe

**Figure 34: Landing Page Wireframe**
*[Space for Landing Page Wireframe]*

**Figure 35: Auction Browse Page Wireframe**
*[Space for Auction Browse Wireframe]*

**Figure 36: Auction Item Details Page Wireframe**
*[Space for Item Details Wireframe]*

**Figure 37: Real-time Bidding Interface Wireframe**
*[Space for Bidding Interface Wireframe]*

**Figure 38: Seller Dashboard Wireframe**
*[Space for Seller Dashboard Wireframe]*

**Figure 39: Admin Dashboard Page Wireframe**
*[Space for Admin Dashboard Wireframe]*

## 4.7 Execution

The Execution stage was associated with deploying the Transparent Bidding Platform with full-stack architecture. The backend was written in Node.js, Express, and SQLite database with direct SQL queries, and the frontend was written in React and Vite. The following are some of the most important implementation files and code snippets illustrating how the auction system was set up, API endpoints created, database models and core bidding features implemented.

### 4.7.1 Technology Stack & Architecture Files:

**Figure 40: (Client-side) package.json - showing frontend dependencies**
*[Space for package.json screenshot]*

This file specifies all the frontend dependencies such as React, Vite, Tailwind CSS, Socket.IO client for real-time bidding, and other necessary libraries needed in the client-side auction application. It also has build scripts and development configurations of the React-based user interface for auction browsing and bidding activities.

**Figure 41: (Server-side) package.json - showing backend dependencies**
*[Space for package.json screenshot]*

This configuration file enumerates all backend dependencies including Express.js, SQLite database drivers, Socket.IO for real-time communication, authentication libraries, eSewa payment gateway integrations, and file upload middleware. It contains server startup scripts and production deployment settings of the Node.js backend for auction management.

**Figure 42: server.js - main entry point server setup**
*[Space for server.js screenshot]*

The primary server file that loads the Express application, creates database connections, initializes Socket.IO for real-time bidding, and spins up the HTTP server on a specified port. It is the main access point into the backend application which bootstraps the auction system and has proper error handling and graceful shutdown processes.

**Figure 43: Express app and middleware configurations**
*[Space for app configuration screenshot]*

The file sets up Express application with necessary middleware such as CORS for cross-origin requests, security headers, rate limitations for API protection, body parsing, file upload handling, and authentication middleware. It initializes the application pipeline that facilitates all incoming HTTP requests for auction operations and subsequently routes them to corresponding controllers.

**Figure 44: Database configuration file**
*[Space for database config screenshot]*

It holds SQLite database connection parameters, database initialization scripts, and auction-specific table creation queries. It sets up the database schema for users, auction items, bids, payments, and other auction-related entities with proper indexing and foreign key relationships.

### 4.7.2 API Implementation

**Figure 45: Main API Router**
*[Space for API router screenshot]*

The central routing file that sorts and delegates API endpoints to particular route modules (auth, auctions, bids, payments, categories). It offers a well-organized way of APIs for auction operations and proper middleware application, as well as route versioning for the bidding platform.

**Figure 46: Auction controller implementation**
*[Space for auction controller screenshot]*

It holds the business logic of auction-related tasks such as creating auction items, managing auction listings, processing bid submissions, handling auction completion, and generating auction reports. It receives HTTP requests, validates the input data, communicates with the database using SQL queries, and responds to appropriate auction requests.

**Figure 47: Auction model schema implementation**
*[Space for auction model screenshot]*

It defines the Auction database model with field definitions, data types, validations, and relationships with other entities. It defines the database structure of auction data such as item details, bidding information, pricing data, and relationships with users, categories, and authentication records.

### 4.7.3 Key Feature Implementation

**Figure 48: auth.js - authentication middleware**
*[Space for auth middleware screenshot]*

Implements JWT token-based authentication middleware that authenticates user sessions and secures auction-related API endpoints. It checks the authenticity of tokens, retrieves user data with role information, and manages token refreshment mechanisms to ensure secure user sessions during bidding activities.

**Figure 49: upload.js - file upload middleware**
*[Space for upload middleware screenshot]*

Processes files uploaded by users with Multer middleware, used to handle auction item photos, authentication documents, and user profile images. It has file validation, size limitations, storage settings, and integration with file storage systems for managing auction item media assets.

**Figure 50: Socket.IO - real-time bidding setup**
*[Space for Socket.IO implementation screenshot]*

Creates Socket.IO-based real-time communication framework to enable instant bidding updates, live auction status changes, and real-time notifications among buyers, sellers, and other platform participants. It handles WebSocket connections, broadcasting bid updates, managing auction rooms, and delivery of real-time notifications during active auctions.

**Figure 51: eSewa payment integration**
*[Space for eSewa integration screenshot]*

Integrates eSewa payment gateway with signature generation and verification to process auction payments securely. It manages the initiation of payments for successful auction transactions, verification of payment completion, and processing of callbacks to enable safe financial transactions for auction winners.

### 4.7.4 Configuration and Setup

**Figure 52: .env - environment configurations**
*[Space for .env screenshot]*

It has sensitive configuration parameters such as database file paths, JWT secrets, eSewa payment gateway credentials, API keys, and third-party service settings. It isolates environment-specific settings and code to guarantee security and allow different deployment configurations for development and production environments.

**Figure 53: Vite.config.js - frontend configurations**
*[Space for Vite config screenshot]*

Configures the Vite build tool with development server settings, build optimizations, plugin configurations, and proxy settings to communicate with auction APIs. It establishes the frontend build pipeline and development environment configuration to achieve the best performance for the auction platform interface.

### 4.7.5 Frontend Implementation

**Figure 54: App.jsx - main entry point of frontend**
*[Space for App.jsx screenshot]*

The root React component that establishes routing for auction pages, global state management for user authentication and auction data, authentication context, and theme providers. It is the application shell that displays various auction pages and controls the structure and navigation of the bidding platform.

**Figure 55: AuctionCard - Auction Item Listing Component**
*[Space for AuctionCard screenshot]*

A reusable React component that renders auction item data such as images, current bid prices, auction status, time remaining, and bidding links in a card format. It has responsive design for user interactions such as favoriting items, viewing details, placing bids, and real-time bid updates.

**Figure 56: api.js - API integration services**
*[Space for api.js screenshot]*

Concentrates all logic of API communication with Axios configuration, request/response interceptors, error handling, and authentication token management for auction operations. It offers a single point of access to frontend components to communicate with backend services for auction browsing, bidding, and user management, and manages shared issues such as loading states and error messages.

## 4.8 Screenshot of User Interface

**Figure 57: Auction Platform Landing Page**
*[Space for Landing Page Screenshot]*

**Figure 58: Browse Auctions Page**
*[Space for Browse Auctions Screenshot]*

**Figure 59: Auction Item Details Page**
*[Space for Item Details Screenshot]*

**Figure 60: Real-time Bidding Interface**
*[Space for Bidding Interface Screenshot]*

**Figure 61: Seller Dashboard**
*[Space for Seller Dashboard Screenshot]*

**Figure 62: Payment Processing Page**
*[Space for Payment Screenshot]*

**Figure 63: Auction History Page**
*[Space for History Screenshot]*

**Figure 64: User Profile Page**
*[Space for Profile Screenshot]*

**Figure 65: Expert Authentication Dashboard**
*[Space for Expert Dashboard Screenshot]*

**Figure 66: Admin Management Panel**
*[Space for Admin Panel Screenshot]*

## 4.9 Summary

In this chapter, the Transparent Bidding Platform for Antique Objects has been described and discussed in detail. The system design involved detailed diagrams like use case, activity, and sequence diagrams to show how buyers, sellers, experts, administrators, and the auction system interact and work together. The database was designed with SQLite and direct SQL queries to allow efficient management of data for users, auction items, bids, payments, authentication records, and notifications. The interface design was based on easy navigation, intuitive bidding interactions, and visually appealing screens, which were facilitated by wireframe and layout designs.

The execution section emphasized the deployment of major auction functions, such as API development, authentication, real-time bidding communication, file uploads for auction items, payment integration with eSewa, and expert authentication features. Frontend and backend technologies have been set up and combined to provide a smooth, responsive, and secure auction platform. Finally, screenshots of the finished application were presented to illustrate how design ideas were applied in practice, how the database was implemented, and how the user interface was designed and displayed a fully functioning auction system that is ready for deployment. In general, the chapter proves that the Transparent Bidding Platform is effective in achieving the targeted goals of creating an interactive, user-friendly, and secure solution for antique object auctions with real-time bidding capabilities.

