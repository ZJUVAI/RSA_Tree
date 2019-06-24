# RSATree

Our coding environment is **ubuntu 18.04** with **32GB** RAM, 500GB SSD

C++ version is **gcc 7.4.0**

node version is **v10.16.0**

cmake version is **3.10.2**

### Construct

First you need to install a library for reading json files

I uses the library from https://github.com/nlohmann/json.git

```
git clone https://github.com/nlohmann/json.git
cd json
mkdir build
cd build
cmake ..
make -j8
sudo make install
```

there is a template about how to builld BRIGHTKITE datasets using C++

I have prepared a smaller binary file of BRIGHTKITE in folder data 

```bash
cd construct
mkdir result
mkdir build
bash build.sh
./solveBrightkiteDays
cp result/* ../backend/data/BRIGHTKITE
```

### Install 

```bash
cd frontend
npm install
npm audit fix 
cd ../backend
npm install
npm audit fix
```

### Run

```bash
# start frontend 
cd frontend
npm run debug


# then start a new terminal then start backend 
cd backend
npm run start
```

you will see the website on <http://localhost:8081/>