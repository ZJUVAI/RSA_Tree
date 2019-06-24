# RSATree

Our coding environment is **ubuntu 18.04** with **32GB** RAM, 500GB SSD

C++ version is **gcc 7.4.0**

node version is **v10.16.0**

### Construct

there is a template about how to builld BRIGHTKITE datasets using C++

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