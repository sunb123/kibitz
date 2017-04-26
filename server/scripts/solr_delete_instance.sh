#!/bin/bash

CORE_NAME=''

while getopts c:f: FLAG; do
    case $FLAG in
        c)
            case $OPTARG in
                *)
		    CORE_NAME=$OPTARG
                ;;
            esac
        ;;
        *)
            echo "error: unknown option $FLAG"
            exit 1
        ;;
    esac
done

sudo -u ubuntu /var/www/html/kibitz/server/solr-6.5.0/bin/solr delete -c $CORE_NAME #delete a core instance
sudo -u ubuntu /var/www/html/kibitz/server/solr-6.5.0/bin/solr restart
