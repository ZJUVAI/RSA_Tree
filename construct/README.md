## Windows

### How to make data
```
cd data
# dataNum dimNum filePath
node writeData.js 123 124 aa.txt
```
### Intall
cmake, mingw-g++7.0

set the CXX_PATH in the CMakeLists.txt
### Build
bash Windows_Make
### Run
Test.exe

***

## Linux
### Build
bash Linux_Make
### Run
./Test

## DA
#### poi
lat lon
number: 93276

#### brightkite1
 
lat lon days | week(7) hour(24)
lat lon seconds | week(7) hour(24)

brightkite_Data_1
number: 4747287

brightkite_Data_1_tiny
number: 474728

#### brightkite2
lat lon | Month(12) hour(24) week(7)
brightkite_Data_2
brightkiteRtree2
brightkiteSAT2
number： 4747172

#### flight
108658184
Depdelay Arrdelay Week Year Carrier_ID Month
small: 1006095 large: 107652090


data: LatelDe distance CarrierDelay
flight2
distance CarrierDelay sum(DepDelay) 

flight3
DepDelay

#### taxi_green
69145084

#### taxi_yellow
1492357797
lat lon week hour whichweek



##### Xian
1536641807
lat lon