package ro.utcn.ds.monitoring.amqp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import ro.utcn.ds.monitoring.amqp.dto.DeviceCreated;
import ro.utcn.ds.monitoring.amqp.dto.UserCreated;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class AmqpConfig {

    public static final String DATA_EXCHANGE = "ems.data";
    public static final String SYNC_EXCHANGE = "ems.sync";
    public static final String WS_EXCHANGE = "ems.ws";

    @Value("${app.ingest-queue:monitoring.ingest.1}")
    private String ingestQueueName;

    @Value("${app.bind-direct:false}")
    private boolean bindDirect;

    @Value("${app.sync-queue:monitoring.sync}")
    private String syncQueueName;

    @Bean
    TopicExchange dataExchange() {
        return new TopicExchange(DATA_EXCHANGE, true, false);
    }

    @Bean
    TopicExchange syncExchange() {
        return new TopicExchange(SYNC_EXCHANGE, true, false);
    }

    @Bean
    TopicExchange wsExchange() {
        return new TopicExchange(WS_EXCHANGE, true, false);
    }

    @Bean
    Queue readingsQueue() {
        return QueueBuilder.durable(ingestQueueName).build();
    }

    @Bean
    Queue syncQueue() {
        return QueueBuilder.durable(syncQueueName).build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.bind-direct", havingValue = "true")
    Declarables dataBindings(@Qualifier("readingsQueue") Queue readingsQueue,
                             @Qualifier("dataExchange") TopicExchange dataExchange) {
        Binding readingsBinding = BindingBuilder.bind(readingsQueue)
                .to(dataExchange)
                .with("device.*.reading");
        return new Declarables(readingsBinding);
    }

    @Bean
    Declarables syncBindings(@Qualifier("syncQueue") Queue syncQueue,
                             @Qualifier("syncExchange") TopicExchange syncExchange) {
        Binding userCreated = BindingBuilder.bind(syncQueue)
                .to(syncExchange)
                .with("user.created");
        Binding deviceCreated = BindingBuilder.bind(syncQueue)
                .to(syncExchange)
                .with("device.created");
        return new Declarables(userCreated, deviceCreated);
    }

    @Bean
    MessageConverter messageConverter(ObjectMapper objectMapper) {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
        // Allow conversion based on target method parameter even fără __TypeId__ header
        converter.setAlwaysConvertToInferredType(true);
        DefaultClassMapper classMapper = new DefaultClassMapper();
        classMapper.setTrustedPackages("*");
        Map<String, Class<?>> idMapping = new HashMap<>();
        // map external type IDs to local DTOs so conversion works even dacă vin din alte servicii
        idMapping.put("ro.utcn.ds.users.amqp.UserCreatedEvent", UserCreated.class);
        idMapping.put("ro.utcn.ds.device.amqp.DeviceCreatedEvent", DeviceCreated.class);
        classMapper.setIdClassMapping(idMapping);
        converter.setClassMapper(classMapper);
        return converter;
    }
}
