APP_NAME="high-processing"
CLUSTER_NAME="high-processing-sample"
PROJECT_NAME="high-processing-project"
REGION="us-east-1"
LOG_GROUP_NAME=""

ECS_ROLE_NAME="ecsTaskExecutionRole"
# FROM AWS IAM POLICIES
ECS_ROLE_ARN="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"

CUSTOM_POLICY_NAME="$APP_NAME"-policy
CUSTOM_POLICY_ARN=""

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