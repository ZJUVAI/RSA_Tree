#include <stdlib.h>
#include <time.h>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <unistd.h>
#include <ctime>
#include <iostream>
#include <map>
#include <memory>
#include <ctime>
#include "genrandom.h"
#include <cstring>
#include "File.h"
// #include "cppconn/driver.h"
// #include "cppconn/exception.h"
// #include "cppconn/metadata.h"
// #include "cppconn/prepared_statement.h"
// #include "cppconn/statement.h"
// #include "mysql_connection.h"
// #include "mysql_driver.h"
#include "Tool.h"

using namespace std;
// using namespace sql;

typedef long long ll;

const int MM = 20;
const ll INF = 1e18;

float minEdge[MM];
float innData[MM];

const int split = 20000000;
char readfile[200] = "Xian_Data";
int dataAll = -1;
void setParams(int argc, char ** argv) {
    int i;
    if ((i = ArgPos((char *) "-read", argc, argv)) > 0) strcpy(readfile, argv[i + 1]);
    if ((i = ArgPos((char *) "-num", argc, argv)) > 0) dataAll = atoi(argv[i + 1]);
}

int main(int argc, char ** argv) {
    // yellowtaxi 1492357797
    setParams(argc, argv);
    const gsl_rng_type* gsl_T;
    gsl_rng_env_setup();
    gsl_T = gsl_rng_rand48;
    gsl_rng *gsl_r = gsl_rng_alloc(gsl_T);
    gsl_rng_set(gsl_r, 314159265);

    int dataFileId = ('O' << 0) | ('R' << 8) | ('I' << 16) | ('D' << 24);
    int readFileId;
    string tt = "./data/" + string(readfile);
    RTFileStream stream;
    if (!stream.OpenRead(tt.c_str())) {
        exit(0);
    }
    string tt2 = tt + "_small";
    RTFileStream stream1;
    if (!stream1.OpenWrite(tt2.c_str())) {
        exit(0);
    }
    string tt3 = tt + "_large";
    RTFileStream stream2;
    if (!stream2.OpenWrite(tt3.c_str())) {
        exit(0);
    }
    cout << tt << " " << tt2 << " " << tt3 << endl;
    int n, m, l;
    stream.Read(readFileId);
    stream.Read(n); stream.Read(m); stream.Read(l);
    if(dataAll != -1) n = dataAll;
    // int cnt1 = 0; int cnt2 = 0;
    printf("%d %d %d\n", n, m, l);

    stream1.Write(dataFileId); stream1.Write(20000000); stream1.Write(m); stream1.Write(l);
    stream2.Write(dataFileId); stream2.Write(80000000); stream2.Write(m); stream2.Write(l);
    int times = n / split; int timeCnt = 0;
    int ch;
    int cnt = 0; int cnt1 = 0; int cnt2 = 0;
    for(int i = 0; i < n; ++i){     
        if(timeCnt == 0) {
            ch = rand() % times;
        }
        for(int j = 0; j < m; ++j) {
            stream.Read(minEdge[j]);
        }
        for(int j = 0; j < l; ++j) {
            stream.Read(innData[j]);
        }
        bool tag = timeCnt == ch;
        if(tag)  cnt1 ++;
        else cnt2 ++;
        for(int j = 0; j < m; ++j)
            if(tag) stream1.Write(minEdge[j]);
            else stream2.Write(minEdge[j]);
        for(int j = 0; j < l; ++j)
            if(tag) stream1.Write(innData[j]);
            else stream2.Write(innData[j]);
        
        timeCnt = (timeCnt + 1) % times;
        cnt ++;
        // for(int j = 0; j < m; ++j) printf("%.3f ", minEdge[j]); printf("\n");
        // for(int j = 0; j < l; ++j) printf("%.3f ", innData[j]); printf("\n");
    }
    for(int j = 0; j < m; ++j) printf("%.3f ", minEdge[j]); printf("\n");
    for(int j = 0; j < l; ++j) printf("%.3f ", innData[j]); printf("\n");
    printf("%d\n", cnt);
    printf("%d %d\n", cnt1, cnt2);
    return 0;
}
