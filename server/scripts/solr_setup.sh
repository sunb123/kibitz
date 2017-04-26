#!/bin/bash

CORE_NAME=''
CSV_FILE_PATH=''

while getopts c:f: FLAG; do
    case $FLAG in
        c)
            case $OPTARG in
                *)
		    CORE_NAME=$OPTARG
                ;;
            esac
        ;;
        f)
            case $OPTARG in
                *)
		    CSV_FILE_PATH=$OPTARG
                ;;
            esac
        ;;        
        *)
            echo "error: unknown option $FLAG"
            exit 1
        ;;
    esac
done

#bin/solr start -p 8983 #default port 8983
#bin/solr stop

#cp solr-6.5.0/server/solr/configsets/basic_configs/conf /var/www/html/kibitz/server/solr-6.5.0/server/solr/${CORE_NAME}
#curl "http://localhost:8983/solr/admin/cores?action=CREATE&name=qwe&instanceDir=${CORE_NAME}"

sudo -u ubuntu /var/www/html/kibitz/server/solr-6.5.0/bin/solr create -c $CORE_NAME #create a core instance
sudo -u ubuntu /var/www/html/kibitz/server/solr-6.5.0/bin/post -c $CORE_NAME $CSV_FILE_PATH  #index a csv file
