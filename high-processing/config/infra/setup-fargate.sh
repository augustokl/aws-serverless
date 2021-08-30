APP_NAME="high-processing"
CLUSTER_NAME="high-processing-sample"
PROJECT_NAME="high-processing-project"
REGION="us-east-1"
LOG_GROUP_NAME="/ecs/$PROJECT_NAME"

ECS_ROLE_NAME="ecsTaskExecutionRole"
# FROM AWS IAM POLICIES
ECS_ROLE_ARN="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"

CUSTOM_POLICY_NAME="$APP_NAME"-policy
CUSTOM_POLICY_ARN=""

ECR_URI_DOCKER="215055501038.dkr.ecr.us-east-1.amazonaws.com/high-processing"
SSW_ENV_PATH="/prod/${PROJECT_NAME}/"

aws iam create-role \
  --region $REGION \
  --role-name $ECS_ROLE_NAME \
  --assume-role-policy-document file://templates/task-execution-assume-role.json \
  | tee logs/1.iam-create-role.txt

aws iam attach-role-policy \
  --region $REGION \
  --role-name $ECS_ROLE_NAME \
  --policy-arn $ECS_ROLE_ARN 

aws iam create-policy \
  --policy-name $CUSTOM_POLICY_NAME \
  --policy-document file://templates/custom-access-policy.json \
  | tee logs/2.create-policy.txt

aws iam attach-role-policy \
  --region $REGION \
  --role-name $ECS_ROLE_NAME \
  --policy-arn $CUSTOM_POLICY_ARN

aws ecs create-cluster \
  --cluster-name $CLUSTER_NAME \
  | tee logs/3.create-cluster.txt

aws logs create-log-group \
  --log-group-name $LOG_GROUP_NAME \
  | tee logs/4.logs-create-log-group.txt

aws ecr create-repository \
  --repository-name $APP_NAME \
  --image-scanning-configuration scanOnPush=true \
  --region $REGION \
  | tee logs/5.create-docker-repo.txt

aws ecs register-task-definition \
  --cli-input-json file://templates/task-definition.json \
  | tee logs/6.register-task.txt
