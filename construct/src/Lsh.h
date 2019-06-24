#ifndef BASASUYA_LSH_H
#define BASASUYA_LSH_H

#include <cmath>
#include <cstdio>
#include <vector>
#include "File.h"


struct lshStruct{
    int _bucketSize;
    int _bucketNum;
    int _hashFuncNum;
    int _sampleNum;
    int _itemNum;
    int _compress;
    float* _domain_min;
    float* _domain_max;
};

template <int NUMDIMS, int SATNODES, int HASHNUM, int HASHSIZE>
class LSH {
  private:
    int itemNum;
    int bucketSize;
    int bucketNum;
    int hashFuncNum;
    int sampleNum;
    int hasTable[HASHSIZE]; // NUMDIMS*bucketSize * sampleNum * hashFuncNum
    float bucketWidth[NUMDIMS];
    float bucketWidth_Re[NUMDIMS];
    float hasFunc[NUMDIMS][HASHNUM];
    int* hasTableId;
    // int hasTableId[1000];
    int setHas[2][SATNODES];

  private:
    int tableIdGet(int _numdim, int _bucketnum, int _samplenum) {
        assert((_numdim * bucketNum + _bucketnum) * sampleNum + _samplenum < NUMDIMS * bucketNum * sampleNum);
        return (_numdim * bucketNum + _bucketnum) * sampleNum + _samplenum;
    } 

    int tableGet(int _numdim, int _bucketnum, int _samplenum, int _bucketsize) {
        assert(((_numdim * bucketNum + _bucketnum) * sampleNum + _samplenum) * bucketSize + _bucketsize < HASHSIZE);
        return ((_numdim * bucketNum + _bucketnum) * sampleNum + _samplenum) * bucketSize + _bucketsize;
    } 

    float Rand() { 
        // return 0.5;
        return ((double) rand() / (RAND_MAX));
    }

  public:
    LSH() {}
    void copy(lshStruct& A) {
         
        bucketSize = A._bucketSize;
        bucketNum = A._bucketNum;
        hashFuncNum = A._hashFuncNum;
        sampleNum = A._sampleNum;
        itemNum = A._itemNum;

        assert(NUMDIMS * bucketSize * sampleNum * bucketNum <= HASHSIZE);

        for(int i = 0; i < NUMDIMS; ++i) {
            
            bucketWidth[i] = (A._domain_max[i] - A._domain_min[i]) / (bucketNum + 1) / A._compress;
            float bucketOffset = Rand() * bucketWidth[i];
            float bucketStep = bucketWidth[i] / hashFuncNum;
            bucketWidth_Re[i] = 1 / bucketWidth[i];

            float offset = bucketOffset;
            for(int j = 0; j < hashFuncNum; ++j) {
				if (offset > bucketWidth[i]) { offset -= bucketWidth[i]; }
                hasFunc[i][j] = offset - A._domain_min[i];
                offset += bucketStep;
            }   
        }
        int hasTableIdSize = NUMDIMS * bucketNum * sampleNum;
        hasTableId = new int(hasTableIdSize);
        for(int i = 0; i < hasTableIdSize; ++i) {
            hasTableId[i] = 0;
        }
        for(int i = 0; i < HASHSIZE; ++i) {
            hasTable[i] = -1;
        }
    }

    void update(float* a_min, float* a_max, int i) {
        // printf("%d\n", i);
        for(int j = 0; j < NUMDIMS; ++j) {
            float value = a_min[j];
            float step = (a_max[j] - a_min[j]) / (sampleNum - 1);
            for(int k = 0; k < sampleNum; ++k) {    
                for (int l = 0; l < hashFuncNum; ++l) {
                    int bucketIdx = (int)floor((hasFunc[j][l] + value) * bucketWidth_Re[j]) % bucketNum;
                    
                    int curIdx = hasTableId[tableIdGet(j, bucketIdx, k)];
                    // printf("%.3f %d\n", value, bucketIdx);
                    if (curIdx >= bucketSize) {
                        // printf("hh\n");
                        // if (Rand() > 0.5) {
                        //     hasTable[tableGet(j, bucketIdx, k, (int)floor(Rand() * bucketSize))] = i;
                        // }
                    } else {
                        hasTable[tableGet(j, bucketIdx, k, curIdx)] = i;
                        hasTableId[tableIdGet(j, bucketIdx, k)] = curIdx + 1;
                    }
                }
                value += step;
            }
        }
        
    }

    void printhasTableId() {
        for(int i = 0; i < NUMDIMS * sampleNum * bucketNum; ++i) printf("%d ", hasTableId[i]); printf("\n");
    }

    void printhasTable() {
        for(int i = 0; i < HASHSIZE; ++i) printf("%d ", hasTable[i]); printf("\n");
    }



    int* testPoint(float *point) {
        int flag = 1;
        memset(setHas, 0, sizeof(setHas));

		for (int j = 0; j < NUMDIMS; j += 1) {
			float value = point[j];
			for (int l = 0; l < hashFuncNum; l += 1) {
				int bucketIdx = std::max(0, ((int)floor((hasFunc[j][l] + value) * bucketWidth_Re[j])) % bucketNum);
				int offset =  hasTable[tableGet(j, bucketIdx, 0, 0)]; 
				for (int k = 0; k < sampleNum * bucketSize; ++k) {
					int temp = hasTable[offset + k];
					if (temp < itemNum && setHas[flag][temp] == j) {
						setHas[flag ^ 1][temp] = j + 1;
					}
				}
			}
			flag ^= 1;
		}
		return setHas[flag];
	}

    int* testRange(float *a_min, float *a_max) {
        int flag = 1;
        memset(setHas, 0, sizeof(setHas));
        
		for (int j = 0; j < NUMDIMS; ++j) {
			float value = a_min[j];
            float step = (a_max[j] - a_min[j]) / (sampleNum - 1);
            // printf("%.4f %.4f\n", value, step);
            for(int k = 0; k < sampleNum; ++k) {
                for (int l = 0; l < hashFuncNum; ++l) {
                    int bucketIdx = std::max(0, ((int)floor((hasFunc[j][l] + value) * bucketWidth_Re[j])) % bucketNum);
                    // printf("%.3f %d\n", value, bucketIdx);
                    int offset = tableGet(j, bucketIdx, k, 0); 
                    for (int m = 0; m < bucketSize; ++m) {
                        int temp = hasTable[offset + m];
                        // printf("%d\n", temp);
                        if(temp == -1) break;
                        if (setHas[flag][temp] == j) {
                            // printf("hhh\n");
                            setHas[flag ^ 1][temp] = j + 1;
                        }
                    }
                }
                value += step;
            }
            flag ^= 1;
            int cnt = 0;
            for(int i = 0; i < SATNODES; ++i) {
                if(setHas[flag][i] == j + 1) {
                    cnt ++;
                }
            }
            printf("%d\n", cnt);
		}

        
        // printf("total: %d\n", cnt);
		return setHas[flag ^ 1];
    }

};



#endif