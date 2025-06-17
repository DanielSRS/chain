// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ChargingConsensus {
    enum StationState { 
        NonExistent,    // Station doesn't exist
        Available,      // Available for reservation
        Reserved,       // Reserved but not charging
        Charging,       // Currently charging a car
        Offline         // Temporarily offline/maintenance
    }
    
    struct Station {
        uint256 id;
        string companyId;
        StationState state;
        address owner;
        address currentUser;  // User who has active reservation/charging
        uint256 activeReservationId;  // Current active reservation ID
    }
    
    struct Reservation {
        uint256 stationId;
        address user;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 chargeAmount;
        bool isPaid;
    }
    
    struct User {
        address userAddress;
        bool isRegistered;
        uint256 activeReservationCount;
        mapping(uint256 => bool) hasReservationOnStation;
    }
    
    mapping(uint256 => Station) public stations;
    mapping(uint256 => Reservation) public reservations;
    mapping(string => address) public companies;
    mapping(address => User) public users;
    
    uint256 public stationCounter;
    uint256 public reservationCounter;
    
    // Enhanced events with more detailed information
    event StationRegistered(uint256 indexed stationId, string companyId, address owner);
    event StationStateChanged(uint256 indexed stationId, StationState oldState, StationState newState);
    event UserRegistered(address indexed user);
    event ReservationCreated(uint256 indexed reservationId, uint256 stationId, address user);
    event ReservationValidationFailed(address user, uint256[] stationIds, string reason);
    event ChargingStarted(uint256 indexed reservationId);
    event ChargingCompleted(uint256 indexed reservationId, uint256 chargeAmount);
    event PaymentProcessed(uint256 indexed reservationId);
    event AtomicReservationCreated(uint256[] reservationIds, uint256[] stationIds, address user);
    event AtomicReservationFailed(uint256[] stationIds, address user, string reason);
    
    // Enhanced modifiers with better validation
    modifier onlyStationOwner(uint256 stationId) {
        require(stations[stationId].state != StationState.NonExistent, "Station does not exist");
        require(stations[stationId].owner == msg.sender, "Not station owner");
        _;
    }
    
    modifier onlyCompany(string memory companyId) {
        require(companies[companyId] == msg.sender, "Not authorized company");
        _;
    }
    
    modifier onlyRegisteredUser() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    modifier validStation(uint256 stationId) {
        require(stations[stationId].state != StationState.NonExistent, "Station does not exist");
        _;
    }
    
    // Centralized validation functions
    function validateStationAvailable(uint256 stationId) public view returns (bool, string memory) {
        if (stations[stationId].state == StationState.NonExistent) {
            return (false, "Station does not exist");
        }
        if (stations[stationId].state == StationState.Reserved) {
            return (false, "Station is already reserved");
        }
        if (stations[stationId].state == StationState.Charging) {
            return (false, "Station is currently charging another vehicle");
        }
        if (stations[stationId].state == StationState.Offline) {
            return (false, "Station is temporarily offline");
        }
        return (true, "Station is available");
    }
    
    function validateUserCanReserve(address user, uint256 stationId) public view returns (bool, string memory) {
        if (!users[user].isRegistered) {
            return (false, "User not registered");
        }
        if (users[user].hasReservationOnStation[stationId]) {
            return (false, "User already has reservation on this station");
        }
        if (users[user].activeReservationCount >= 3) { // Max 3 active reservations
            return (false, "User has too many active reservations");
        }
        return (true, "User can make reservation");
    }
    
    function validateMultipleStations(uint256[] memory stationIds) public view returns (bool, string memory) {
        require(stationIds.length > 0, "No stations provided");
        require(stationIds.length <= 10, "Too many stations requested"); // Max 10 stations
        
        for (uint256 i = 0; i < stationIds.length; i++) {
            (bool isAvailable, string memory reason) = validateStationAvailable(stationIds[i]);
            if (!isAvailable) {
                return (false, string(abi.encodePacked("Station ", uintToString(stationIds[i]), ": ", reason)));
            }
        }
        return (true, "All stations available");
    }
    
    function registerUser() external {
        require(!users[msg.sender].isRegistered, "User already registered");
        
        users[msg.sender].userAddress = msg.sender;
        users[msg.sender].isRegistered = true;
        users[msg.sender].activeReservationCount = 0;
        
        emit UserRegistered(msg.sender);
    }
    
    function registerCompany(string memory companyId) external {
        companies[companyId] = msg.sender;
    }
    
    function registerStation(string memory companyId) external onlyCompany(companyId) {
        stationCounter++;
        stations[stationCounter] = Station({
            id: stationCounter,
            companyId: companyId,
            state: StationState.Available,
            owner: msg.sender,
            currentUser: address(0),
            activeReservationId: 0
        });
        
        emit StationRegistered(stationCounter, companyId, msg.sender);
    }
    
    function setStationState(uint256 stationId, StationState newState) external onlyStationOwner(stationId) {
        StationState oldState = stations[stationId].state;
        stations[stationId].state = newState;
        
        emit StationStateChanged(stationId, oldState, newState);
    }
    
    function createReservation(uint256 stationId, uint256 startTime, uint256 endTime) external onlyRegisteredUser validStation(stationId) {
        // Centralized validation using contract functions
        (bool stationAvailable, string memory stationReason) = validateStationAvailable(stationId);
        require(stationAvailable, stationReason);
        
        (bool userCanReserve, string memory userReason) = validateUserCanReserve(msg.sender, stationId);
        require(userCanReserve, userReason);
        
        require(startTime < endTime, "Invalid time range");
        require(startTime >= block.timestamp, "Start time must be in the future");
        
        reservationCounter++;
        reservations[reservationCounter] = Reservation({
            stationId: stationId,
            user: msg.sender,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            chargeAmount: 0,
            isPaid: false
        });
        
        // Update station and user state
        stations[stationId].state = StationState.Reserved;
        stations[stationId].currentUser = msg.sender;
        stations[stationId].activeReservationId = reservationCounter;
        
        users[msg.sender].activeReservationCount++;
        users[msg.sender].hasReservationOnStation[stationId] = true;
        
        emit ReservationCreated(reservationCounter, stationId, msg.sender);
    }
    
    function startCharging(uint256 reservationId) external onlyStationOwner(reservations[reservationId].stationId) {
        require(reservations[reservationId].isActive, "Reservation not active");
        require(stations[reservations[reservationId].stationId].state == StationState.Reserved, "Station not in reserved state");
        
        stations[reservations[reservationId].stationId].state = StationState.Charging;
        
        emit ChargingStarted(reservationId);
    }
    
    function completeCharging(uint256 reservationId, uint256 chargeAmount) external onlyStationOwner(reservations[reservationId].stationId) {
        require(reservations[reservationId].isActive, "Reservation not active");
        require(stations[reservations[reservationId].stationId].state == StationState.Charging, "Station not charging");
        
        uint256 stationId = reservations[reservationId].stationId;
        address user = reservations[reservationId].user;
        
        reservations[reservationId].chargeAmount = chargeAmount;
        reservations[reservationId].isActive = false;
        
        // Update station state
        stations[stationId].state = StationState.Available;
        stations[stationId].currentUser = address(0);
        stations[stationId].activeReservationId = 0;
        
        // Update user state
        users[user].activeReservationCount--;
        users[user].hasReservationOnStation[stationId] = false;
        
        emit ChargingCompleted(reservationId, chargeAmount);
    }
    
    function cancelReservation(uint256 reservationId) external {
        require(reservations[reservationId].user == msg.sender, "Not your reservation");
        require(reservations[reservationId].isActive, "Reservation not active");
        
        uint256 stationId = reservations[reservationId].stationId;
        
        reservations[reservationId].isActive = false;
        
        // Update station state
        stations[stationId].state = StationState.Available;
        stations[stationId].currentUser = address(0);
        stations[stationId].activeReservationId = 0;
        
        // Update user state
        users[msg.sender].activeReservationCount--;
        users[msg.sender].hasReservationOnStation[stationId] = false;
    }
    
    function cancelAtomicReservation(uint256[] memory reservationIds) external {
        for (uint256 i = 0; i < reservationIds.length; i++) {
            require(reservations[reservationIds[i]].user == msg.sender, "Not your reservation");
            require(reservations[reservationIds[i]].isActive, "Reservation not active");
            
            uint256 stationId = reservations[reservationIds[i]].stationId;
            
            reservations[reservationIds[i]].isActive = false;
            
            // Update station state
            stations[stationId].state = StationState.Available;
            stations[stationId].currentUser = address(0);
            stations[stationId].activeReservationId = 0;
            
            // Update user state
            users[msg.sender].hasReservationOnStation[stationId] = false;
        }
        
        // Update user's total active reservation count
        users[msg.sender].activeReservationCount -= reservationIds.length;
    }
    
    // Utility function for string conversion
    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // View functions for querying state
    function getStationState(uint256 stationId) external view returns (StationState) {
        return stations[stationId].state;
    }
    
    function getUserActiveReservations(address user) external view returns (uint256) {
        return users[user].activeReservationCount;
    }
    
    function isUserRegistered(address user) external view returns (bool) {
        return users[user].isRegistered;
    }
    
    function processPayment(uint256 reservationId) external payable {
        require(reservations[reservationId].user == msg.sender, "Not your reservation");
        require(!reservations[reservationId].isPaid, "Already paid");
        require(msg.value >= reservations[reservationId].chargeAmount, "Insufficient payment");
        
        reservations[reservationId].isPaid = true;
        
        // Transfer payment to station owner
        payable(stations[reservations[reservationId].stationId].owner).transfer(msg.value);
        
        emit PaymentProcessed(reservationId);
    }
    
    function createAtomicReservation(
        uint256[] memory stationIds, 
        uint256[] memory startTimes, 
        uint256[] memory endTimes
    ) external onlyRegisteredUser returns (uint256[] memory) {
        require(stationIds.length == startTimes.length, "Array length mismatch");
        require(startTimes.length == endTimes.length, "Array length mismatch");
        
        // Centralized validation using contract function
        (bool allValid, string memory reason) = validateMultipleStations(stationIds);
        if (!allValid) {
            emit AtomicReservationFailed(stationIds, msg.sender, reason);
            revert(reason);
        }
        
        // Additional user validation for atomic reservations
        require(users[msg.sender].activeReservationCount + stationIds.length <= 10, "Too many total reservations");
        
        // Validate time ranges
        for (uint256 i = 0; i < stationIds.length; i++) {
            require(startTimes[i] < endTimes[i], "Invalid time range");
            require(startTimes[i] >= block.timestamp, "Start time must be in the future");
            
            // Check user doesn't already have reservation on any of these stations
            require(!users[msg.sender].hasReservationOnStation[stationIds[i]], 
                    string(abi.encodePacked("User already has reservation on station ", uintToString(stationIds[i]))));
        }
        
        // Phase 2: Create all reservations atomically (only if all validations pass)
        uint256[] memory reservationIds = new uint256[](stationIds.length);
        
        for (uint256 i = 0; i < stationIds.length; i++) {
            reservationCounter++;
            reservationIds[i] = reservationCounter;
            
            reservations[reservationCounter] = Reservation({
                stationId: stationIds[i],
                user: msg.sender,
                startTime: startTimes[i],
                endTime: endTimes[i],
                isActive: true,
                chargeAmount: 0,
                isPaid: false
            });
            
            // Update station state
            stations[stationIds[i]].state = StationState.Reserved;
            stations[stationIds[i]].currentUser = msg.sender;
            stations[stationIds[i]].activeReservationId = reservationCounter;
            
            // Update user state
            users[msg.sender].hasReservationOnStation[stationIds[i]] = true;
            
            emit ReservationCreated(reservationCounter, stationIds[i], msg.sender);
        }
        
        // Update user's total active reservation count
        users[msg.sender].activeReservationCount += stationIds.length;
        
        emit AtomicReservationCreated(reservationIds, stationIds, msg.sender);
        return reservationIds;
    }
    

    
    function getStation(uint256 stationId) external view returns (Station memory) {
        return stations[stationId];
    }
    
    function getReservation(uint256 reservationId) external view returns (Reservation memory) {
        return reservations[reservationId];
    }
}
