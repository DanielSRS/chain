// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ChargingConsensus {
    struct Station {
        uint256 id;
        string companyId;
        bool isAvailable;
        address owner;
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
    
    mapping(uint256 => Station) public stations;
    mapping(uint256 => Reservation) public reservations;
    mapping(string => address) public companies;
    
    uint256 public stationCounter;
    uint256 public reservationCounter;
    
    event StationRegistered(uint256 indexed stationId, string companyId, address owner);
    event ReservationCreated(uint256 indexed reservationId, uint256 stationId, address user);
    event ChargingStarted(uint256 indexed reservationId);
    event ChargingCompleted(uint256 indexed reservationId, uint256 chargeAmount);
    event PaymentProcessed(uint256 indexed reservationId);
    
    modifier onlyStationOwner(uint256 stationId) {
        require(stations[stationId].owner == msg.sender, "Not station owner");
        _;
    }
    
    modifier onlyCompany(string memory companyId) {
        require(companies[companyId] == msg.sender, "Not authorized company");
        _;
    }
    
    function registerCompany(string memory companyId) external {
        companies[companyId] = msg.sender;
    }
    
    function registerStation(string memory companyId) external onlyCompany(companyId) {
        stationCounter++;
        stations[stationCounter] = Station({
            id: stationCounter,
            companyId: companyId,
            isAvailable: true,
            owner: msg.sender
        });
        
        emit StationRegistered(stationCounter, companyId, msg.sender);
    }
    
    function createReservation(uint256 stationId, uint256 startTime, uint256 endTime) external {
        require(stations[stationId].isAvailable, "Station not available");
        require(startTime < endTime, "Invalid time range");
        
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
        
        stations[stationId].isAvailable = false;
        
        emit ReservationCreated(reservationCounter, stationId, msg.sender);
    }
    
    function startCharging(uint256 reservationId) external onlyStationOwner(reservations[reservationId].stationId) {
        require(reservations[reservationId].isActive, "Reservation not active");
        
        emit ChargingStarted(reservationId);
    }
    
    function completeCharging(uint256 reservationId, uint256 chargeAmount) external onlyStationOwner(reservations[reservationId].stationId) {
        require(reservations[reservationId].isActive, "Reservation not active");
        
        reservations[reservationId].chargeAmount = chargeAmount;
        reservations[reservationId].isActive = false;
        stations[reservations[reservationId].stationId].isAvailable = true;
        
        emit ChargingCompleted(reservationId, chargeAmount);
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
    
    function getStation(uint256 stationId) external view returns (Station memory) {
        return stations[stationId];
    }
    
    function getReservation(uint256 reservationId) external view returns (Reservation memory) {
        return reservations[reservationId];
    }
}
